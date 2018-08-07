# Lextend
# Copyright (C) 2018 Lextira AG

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

# coding=utf-8
# !/usr/bin/env python2
from flask import Flask, render_template, request, session, url_for, redirect, jsonify

from flask_cors import cross_origin  # flask.ext.cors,CORS

from utils.ip_utils import *
from utils.sounds_utils import *
from utils.settings import *
from configuration.config_manager import *
import rpyc

import ipaddress

import logging.handlers

import os
import socket
import time
import threading

logger = logging.getLogger()
LOG_FILENAME = "/var/log/lextend.rpi.log"
handler = logging.handlers.RotatingFileHandler(LOG_FILENAME, mode="a",
                                               maxBytes=1024*1024*1,
                                               backupCount=5)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
handler.setLevel(logging.INFO)
if logger.handlers:
    for handler in logger.handlers:
        logger.removeHandler(handler)
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

logger.info("Starting RPi Manager.")

app = Flask(__name__, static_folder="webfrontend/static", template_folder="webfrontend/templates/")

OTA_LATEST_VERSION = ""
OTA_LATEST_FILENAME = ""


@app.route("/", methods=['GET', 'POST'])
def root():
    """ Website entry point. Redirect to signin page to check credentials.
    """

    return redirect(url_for("signin"))


@app.route("/lextend_settings", methods=['GET', 'POST'])
def lextend_settings():
    """ Redirect to Lextend Settings page.
    """
    if "username" not in session:
        return redirect(url_for("signin"))

    try:
        local_ip = get_local_ip()
    except:
        local_ip = ""

    port = os.environ.get("USER_DEFINED_PORT_WEB")
    lextend_settings_url = "http://%s:%s" % (local_ip, port)

    return redirect(lextend_settings_url)


@app.route("/services", methods=['GET', 'POST'])
def services():
    """ Services page, this is the main page after login.
    """
    if "username" not in session:
        return redirect(url_for("signin"))

    return render_template("services.html")


@app.route("/settings/io", methods=['GET', 'POST'])
def settings_io():
    """ Settings page.
    """
    if "username" not in session:
        return redirect(url_for("signin"))

    cfg = app.config["cfg"]

    # Connect to the RPC server
    remote_flic_pool_manager = None
    try:
        conn = rpyc.connect(RPC_IP, RPC_PORT_2)
        remote_flic_pool_manager = conn.root.get_flicPoolManager()
        remote_flic_pool_manager.start()
    except:
        # logger.error("Could not connect to RPC server for flic.")
        pass

    n = len(remote_flic_pool_manager.bd_addr_button) if remote_flic_pool_manager is not None else 0

    if request.method == 'POST':
        rf = request.form               # just a shortcut

        try:
            action = request.form["action"]
        except:
            action = ""

        if "Save" == action:
            try:
                for i in range(6):
                    cfg.gpio.udp_payload_rising[i] = rf["udp_payload_rising_%s" % i]
                    cfg.gpio.udp_payload_falling[i] = rf["udp_payload_falling_%s" % i]
            except:
                pass

            try:
                for i in range(n):
                    cfg.flic.click[i] = rf["flic_%s_click" % i]
                    cfg.flic.double_click[i] = rf["flic_%s_double_click" % i]
                    cfg.flic.hold[i] = rf["flic_%s_hold" % i]

            except:
                pass
            cfg.save()

    return render_template("settings/io.html",
                           cfg=cfg, remote_flic_pool_manager=remote_flic_pool_manager, n=n)


@app.route("/flic_test", methods=['GET'])
@cross_origin()
def settings_flic_test():
    if "username" not in session:
        return redirect(url_for("signin"))

    cfg = app.config["cfg"]
    flic_action = None
    try:
        discover = request.args.get('action')
        if "Discover" == discover:
            remote_flic_pool_manager = None
            try:
                conn = rpyc.connect(RPC_IP, RPC_PORT_2)
                remote_flic_pool_manager = conn.root.get_flicPoolManager()
            except:
                # logger.error("Could not connect to RPC server for flic.")
                pass
            flic_status = remote_flic_pool_manager.flic_status
            return jsonify({"flic_status": flic_status})

    except:
        pass

    try:
        no = int(request.args.get('no'))
        click = request.args.get('click')
        if "click" == click:
            flic_action = cfg.flic.click[no]
        elif "double" == click:
            flic_action = cfg.flic.double_click[no]
        elif click == "hold":
            flic_action = cfg.flic.hold[no]

        logger.info("flic_test using packet: %s" % flic_action)
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(bytes(flic_action, "utf-8"), ("localhost", UDP_PORT))
    except:
        pass

    return ""


@app.route("/io_test", methods=['GET'])
@cross_origin()
def settings_io_test():
    if "username" not in session:
        return redirect(url_for("signin"))
    cfg = app.config["cfg"]

    try:
        io_id = request.args.get('io_id')
        is_rising = request.args.get('rising') == "true"

        if is_rising:
            packet = cfg.gpio.udp_payload_rising[int(io_id)]
        else:
            packet = cfg.gpio.udp_payload_falling[int(io_id)]

        logger.info("io_test using packet: %s" % packet)

        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(bytes(packet, "utf-8"), ("localhost", UDP_PORT))
    except:
        pass

    return ""


@app.route("/settings/general", methods=['GET', 'POST'])
def settings_general():
    if "username" not in session:
        return redirect(url_for("signin"))

    cfg = app.config["cfg"]

    require_reboot = False
    if request.method == 'POST':
        rf = request.form               # just a shortcut

        try:
            action = rf["action"]
        except:
            action = ""

        if "Save" == action:

            # enable_wifi = ""
            # try:
            #     enable_wifi = rf["wifi.enable"]
            #     cfg.general.wifi.enable = True if "on" == enable_wifi else False
            # except:
            #     pass

            try:
                ssid = rf["wifi.ssid"]
                password = rf["wifi.password"]
                if ssid == "":
                    raise Exception()
                cfg.general.wifi.ssid = ssid
                if password == "":
                    raise Exception()
                cfg.general.wifi.password = password
                change_ssid(ssid)
                change_psk(password)
                interfaces = os.listdir('/sys/class/net/')
                winame = ""
                for interface in interfaces:
                    if "wlan" in interface:
                        winame = interface
                # change_wlan(winame)
                require_reboot = True
            except:
                pass

            try:
                value = str(rf["lextend.ip"])
                new = ipaddress.ip_address(value)
                if ipaddress.ip_address(cfg.general.lextend.ip) != new:
                    cfg.general.lextend.ip = str(new)
                    change_ip_address(new)
                    require_reboot = True
            except:
                pass
            try:
                value = str(rf["lextend.netmask"])
                new = ipaddress.ip_address(value)
                if ipaddress.ip_address(cfg.general.lextend.netmask) != new:
                    cfg.general.lextend.netmask = str(new)
                    change_netmask(new)
                    require_reboot = True
            except:
                pass
            try:
                value = str(rf["lextend.gateway"])
                new = ipaddress.ip_address(value)
                if ipaddress.ip_address(cfg.general.lextend.gateway) != new:
                    cfg.general.lextend.gateway = str(new)
                    change_gateway(new)
                    require_reboot = True
            except:
                pass
            try:
                value = str(rf["lextend.dns1"])
                value2 = str(rf["lextend.dns2"])
                new = ipaddress.ip_address(value)
                new2 = ipaddress.ip_address(value2)
                if ipaddress.ip_address(cfg.general.lextend.dns1) != new \
                        or ipaddress.ip_address(cfg.general.lextend.dns2) != new2:
                    cfg.general.lextend.dns1 = str(new)
                    cfg.general.lextend.dns2 = str(new2)
                    change_dns("%s %s" % (new, new2))
                    require_reboot = True
            except:
                pass
            try:
                value = int(rf["lextend.port"])
                if value < 1 or value > 65535:
                    raise Exception()
                if value != cfg.general.lextend.port:
                    require_reboot = True
                cfg.general.lextend.port = value
            except:
                pass
            try:
                value = str(rf["miniserver.ip"])
                new = ipaddress.ip_address(value)  # Validate ip address
                cfg.general.miniserver.ip = str(new)
            except:
                pass
            try:
                value = int(rf["miniport.port"])
                if value < 1 or value > 65535:
                    raise Exception()
                cfg.general.miniserver.port = value
            except:
                pass

            try:
                value = rf["admin.username"]
                if value == "":
                    raise Exception()
                cfg.general.admin.name = value
            except:
                pass

            try:
                value = rf["admin.password"]
                if value == "":
                    raise Exception()
                value2 = rf["admin.password_confirm"]
                if value == "":
                    raise Exception()
                if value != value2:
                    raise Exception()

                cfg.general.admin.password = value
            except:
                pass

            cfg.save()

        elif "Reset" == action:
            cfg.reset_general()
            require_reboot = True         # Always reboot, no change check is done.

        if require_reboot:
            def reboot():
                logger.info("rebooting in 4 seconds ...")
                time.sleep(4)
                logger.info("rebooting now")
                os.system("reboot")

            threading.Thread(target=reboot).start()

    def commandExists(command):
        def canExecute(file):
            return os.path.isfile(file) and os.access(file, os.X_OK)

        for path in os.environ["PATH"].split(os.pathsep):
            file = os.path.join(path, command)
            if canExecute(file):
                return True
        return False

    wifi_list = []
    try:
        if not commandExists("ifconfig"):
            logging.error("You will need the command 'ifconfig' to continue.")
            # quit()
        interfaces = os.listdir('/sys/class/net/')
        winame = ""
        for interface in interfaces:
            if "wlan" in interface:
                winame = interface

        logging.info("Wireless device enabled!")
        logging.info("Checking for available wireless networks.")

        stream = os.popen("iwlist %s scan" % winame)

        logging.info("Available Networks:")

        networksfound = 0
        for line in stream:
            if "ESSID" in line:
                networksfound += 1
                wifi_list.append(" " + line.split('ESSID:"', 1)[1].split('"', 1)[0])

        if networksfound == 0:
            logging.error("Looks like we didn't find any networks in your area.")

        wifi_list = [x.strip() for x in wifi_list]
        logging.info(wifi_list)
    except:
        logging.error("Error in getting wifi ssid")

    return render_template("settings/general.html", cfg=cfg, require_reboot=require_reboot,
                           hostname=socket.gethostname(), wifi_list=wifi_list)


@app.route("/signin", methods=['GET', 'POST'])
def signin():
    """ Signin page
    """
    cfg = app.config["cfg"]

    def goto_page_after_login():
        return redirect(url_for("services"))

    if request.method == "POST":
        rf = request.form               # just a shortcut
        username = rf["username"]
        password = rf["password"]

        # username = "" => false authentication, could be used for dev.
        if not DEBUG_ENABLE_EMPTY_AUTH:
            if username == "":
                return render_template("signin.html", error=True)
        if username == cfg.general.admin.name and password == cfg.general.admin.password:
            # if pam_helper.pam_auth(username, password):
            session["username"] = username
            return goto_page_after_login()
        else:
            return render_template("signin.html", error=True)
    elif request.method == "GET":
        if "username" in session:
            return goto_page_after_login()
        else:
            return render_template("signin.html", error=False)


@app.route("/signout")
def signout():
    """ Signout page
    """

    if "username" not in session:
        return redirect(url_for("signin"))

    session.pop("username", None)
    return redirect(url_for("root"))


def main():
    # Create and add ConfigManager and SoundsManager to app global space.
    logger.info("running version %s" % SOFTWARE_VERSION)
    try:
        local_ip = get_local_ip()
    except:
        local_ip = ""
    app.config["cfg"] = ConfigManager(CONFIGURATION_SUBDIRECTORY,
                                      CONFIGURATION_FILENAME,
                                      lextend_ip=local_ip)
    app.config["soundsManager"] = SoundsManager(CONFIGURATION_SUBDIRECTORY)

    # Start the auto update background thread

    # Create and run the web app.
    app.secret_key = "Ag~EpxZ3&,h28fA.Ze;iZ1EO,F4e5dRZ)"
    app.debug = FLASK_DEBUG
    app.config['MAX_CONTENT_LENGTH'] = FLASK_MAX_UPLOAD_SIZE
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 10  # cache control max age for send_static_file()
    app.run(host=SERVER_ADDRESS,
            port=os.environ.get('USER_DEFINED_PORT_RPI'),
            # debug=True,
            threaded=True,
            use_reloader=FLASK_USE_RELOADER)


if __name__ == "__main__":
    main()
