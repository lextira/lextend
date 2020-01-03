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

#import os
#import time
import flask
from flask import Flask, render_template, request, session, url_for, redirect, jsonify, send_file
from werkzeug.utils import secure_filename

from flask_cors import cross_origin  # flask.ext.cors,CORS

#from configuration import ConfigManager
# from webfrontend import pam_helper
from utils.ip_utils import *
from utils.sounds_utils import *
from utils.settings import *
from configuration.config_manager import *
import rpyc

import ipaddress
import threading
import subprocess
import shlex

import datetime
from random import randint

import socket

import urllib

import ftplib
from pkg_resources import parse_version

import zipfile
import glob

# import logging
import logging.handlers

import os
import time
import threading

logger = logging.getLogger()
LOG_FILENAME = "/var/log/lextend.webfrontend.log"
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

logger.info("Starting Lextend Webfrontend.")

app = Flask(__name__, static_folder="webfrontend/static", template_folder="webfrontend/templates/")

OTA_LATEST_VERSION = ""
OTA_LATEST_FILENAME = ""


@app.route("/", methods=['GET', 'POST'])
def root():
    """ Website entry point. Redirect to signin page to check credentials.
    """
    return redirect(url_for("signin"))


@app.route("/services", methods=['GET', 'POST'])
def services():
    """ Services page, this is the main page after login.
    """
    if "username" not in session:
        return redirect(url_for("signin"))

    return render_template("services.html")


@app.route("/settings/sonos_doorbell", methods=['GET', 'POST'])
def settings_sonos_doorbell():
    """ Settings page.
    """

    if "username" not in session:
        return redirect(url_for("signin"))

    cfg = app.config["cfg"]
    soundsManager = app.config["soundsManager"]

    # Connect to the RPC server
    remote_sonosPoolManager = None
    try:
        conn = rpyc.connect(RPC_IP, RPC_PORT_1)
        remote_sonosPoolManager = conn.root.get_sonosPoolManager()
        remote_sonosPoolManager.discover()
    except:
        #When multiple rpyc error occurs, the existing lextend engine process has to be killed before starting a new instance
        
        PID = subprocess.check_output("ps aux|grep lextend_engine | awk '{print $2}'", shell=True)
        pid = PID.split("\n")[0:3]
        try:
            pid_int = map(int,pid)
            for i in pid_int:
               cmd = "sudo kill -9 %s"%(i)
               os.system(cmd)
        except:
            pass
        os.system("sudo /usr/bin/lextend_engine &")
        logger.error("Could not connect to RPC server.")
    
    time.sleep(6)
    remote_sonosPoolManager = None
    try:
        conn = rpyc.connect(RPC_IP, RPC_PORT)
        remote_sonosPoolManager = conn.root.get_sonosPoolManager()
        remote_sonosPoolManager.discover()
    except:
        #os.system("sudo /usr/bin/lextend_engine &")
        logger.error("Could not connect to RPC server.")    

    custom_files = os.listdir(SGW_CUSTOMSOUNDS)
    custom_files.sort()
    commercial_files = os.listdir(SGW_COMMERCIALS)
    commercial_files.sort()
    for i in range(1, 10):

        # To upload custom sound files
        if not("".join(custom_files[i-1:i]).startswith(str(i))):
            custom_files.insert(i-1, "")
        sound = "".join(custom_files[(i-1):i])
        if (sound not in cfg.sonos_doorbell.sounds_filelist) and (sound.startswith("%d" % i)):
            cfg.sonos_doorbell.sounds_filelist[(i - 1)] = sound

        # To upload commercial sound files
        if not("".join(commercial_files[i-1:i]).startswith(str(i))):
            commercial_files.insert(i-1, "")
        commercial = "".join(commercial_files[i-1:i])
        if (commercial not in cfg.sonos_doorbell.commercials.sounds_filelist) and (commercial.startswith("%d" % i)):
            cfg.sonos_doorbell.commercials.sounds_filelist[(i - 1)] = commercial
    cfg.save()

    if request.method == 'POST':
        rf = request.form               # just a shortcut

        try:
            action = request.form["action"]
        except:
            action = ""

        if "Save" == action:
            try:
                value = rf["sonos_doorbell.enable"]
                cfg.sonos_doorbell.enable = True if "on" == value else False
            except:
                pass
            try:
                ignore_sonos_names = rf["sonos_doorbell.ignore_sonos_names"]
                cfg.sonos_doorbell.ignore_sonos_names = True if "on" == ignore_sonos_names else False
            except:
                pass
            try:
                value = rf["sonos_doorbell.volume_override"]
                cfg.sonos_doorbell.volume_override = True if "on" == value else False
            except:
                pass
            try:
                value = int(rf["sonos_doorbell.volume"])
                if 0 <= value <= 100:
                    cfg.sonos_doorbell.volume = value
            except:
                pass
            try:
                value = int(rf["sonos_doorbell.default_sound"])
                # 0 = no override
                if 0 <= value <= 10:
                    cfg.sonos_doorbell.default_sound = value
            except:
                pass
            try:
                cfg.sonos_doorbell.protocol = str(rf["protocol"])
            except:
                pass

            file = None
            # Handle files
            for i in range(1, 10):
                to_delete_file = "delete_sound_file_%s" % i
                request_files = "sound_file_%s" % i  # new line after python3.4
                if to_delete_file in rf:
                    soundsManager.delete_file_by_index(i)
                    cfg.sonos_doorbell.sounds_filelist[i-1] = "default sound"
                elif request_files in request.files:  # new check after python3.4
                    try:
                        file = request.files["sound_file_%s" % i]
                        if file:
                            filename = secure_filename(file.filename)
                            cfg.sonos_doorbell.sounds_filelist[i-1] = filename
                            soundsManager.delete_file_by_index(i)
                            file.save(soundsManager.create_upload_path(i, filename))
                    except:
                        logger.error("Could not upload custom file %d." % i)
            # commercials
            try:
                value = rf["sonos_doorbell.commercials.volume_override"]
                cfg.sonos_doorbell.commercials.volume_override = True if "on" == value else False
            except:
                pass
            try:
                value = int(rf["sonos_doorbell.commercials.volume"])
                if 0 <= value <= 100:
                    cfg.sonos_doorbell.commercials.volume = value
            except:
                pass

            for i in range(1, 10):
                to_delete_file = "delete_commercial_file_%s" % i
                request_files = "commercial_file_%s" % i  # new line after python3.4
                if to_delete_file in rf:
                    soundsManager.delete_commercial_by_index(i)
                    cfg.sonos_doorbell.commercials.sounds_filelist[i-1] = ""
                elif request_files in request.files:  # new check after python3.4
                    try:
                        file = request.files["commercial_file_%s" % i]
                        if file:
                            filename = secure_filename(file.filename)
                            cfg.sonos_doorbell.commercials.sounds_filelist[i-1] = filename
                            soundsManager.delete_commercial_by_index(i)
                            file.save(soundsManager.create_commercial_upload_path(i, filename))
                    except:
                            logger.error("Could not upload commercial file %d." % i)

            cfg.save()
        elif "Reset" == action:
            for i in range(1, 10):
                soundsManager.delete_file_by_index(i)

            cfg.reset_sonos_doorbell()
        elif "Discover" == action:
            try:
                remote_sonosPoolManager.discover()
    #            remote_sonosPoolManager.discover()
            except:
                logger.error("Could not run sonos discovery.", exc_info=True)
            
        else:
            logger.error("Unknown post action : %s" % action)

    sonos_list = []
    try:
        logger.info("Sonos devices list : " % remote_sonosPoolManager.devices_list)
        sonos_list = remote_sonosPoolManager.devices_list
    except:
        logger.error("Could not get sonos devices list.")
##########################################################################
    try:
        return render_template("settings/sonos_doorbell.html", cfg=cfg, sonos_list=sonos_list)
    except:
        os.system("sudo /usr/bin/lextend_engine &")
        time.sleep(20)
        return redirect(url_for("settings_sonos_doorbell")) 
############################################################################

    return render_template("settings/sonos_doorbell.html", cfg=cfg, sonos_list=sonos_list)


@app.route("/learn_radio", methods=['GET'])
@cross_origin()
def learn_radio():
    # if not "username" in session:
    #  return redirect(url_for("signin"))

    logger.info("learn_radio")
    try:
        slot = int(request.args.get('slot')) - 1
        learn_from = request.args.get('from')
        cfg = app.config["cfg"]

        if slot < 0 or slot > 10:
            logger.error("Radio slot error: %s." % slot)
            return jsonify(({"result": False, "msg": "An error occurred!"}))

        logger.info("learning radio %s" % slot)

        # remote_sonosPoolManager = None
        try:
            conn = rpyc.connect(RPC_IP, RPC_PORT_1)
            remote_sonosPoolManager = conn.root.get_sonosPoolManager()
        except:
            logger.error("Could not connect to RPC server.")
            return jsonify({"result": False, "msg": "An error occurred!"})

        try:
            remote_sonosPoolManager.discover()
        except:
            logger.error("Could not run sonos discovery.", exc_info=True)
            return jsonify({"result": False, "msg": "An error occurred!"})

        try:
            sonos_list = remote_sonosPoolManager.devices_list
            for s in sonos_list:
                if s.device.is_coordinator and s.device.uid == learn_from:
                    # and "PLAYING" in s.device.get_current_transport_info()["current_transport_state"]:
                    logger.info("learning from coordinator : %s" % s.device.player_name)
                    media_info = remote_sonosPoolManager.get_tunein_info(s.device)
                    url = cfg.sonos_doorbell.saved_radios[slot].url = media_info['CurrentURI']
                    meta = cfg.sonos_doorbell.saved_radios[slot].meta = media_info['CurrentURIMetaData']
                    name = cfg.sonos_doorbell.saved_radios[slot].name = ""
                    try:
                        name = cfg.sonos_doorbell.saved_radios[slot].name = meta.split("title>")[1].split("<")[0]
                    except:
                        pass
                    logger.info("learning : %s, %s, %s, %s" % (slot, s.device.player_name, meta, name))

                    if url == "":
                        return jsonify({"result": False, "msg": "An error occurred!"})

                    cfg.save()
                    return jsonify({"result": True, "url": url, "name": name})

        except:
            logger.error("Could not get radio station.", exc_info=True)
            return jsonify({"result": False, "msg": "An error occurred!"})

    except:
        pass

    return jsonify({"result": False, "msg": "An error occurred!"})


def execute_software_update(version):
    global OTA_LATEST_FILENAME
    if version == OTA_LATEST_VERSION:
        logger.info("Upgrading to version %s started ..." % version)

        def ota_and_reboot():
            logger.info("downloading new software package %s" % OTA_LATEST_FILENAME)
            try:
                ftp = ftplib.FTP(OTA_SERVER, OTA_SERVER_LOGIN, OTA_SERVER_PASSWORD)
                file = open(OTA_LATEST_FILENAME, 'wb')
                ftp.retrbinary('RETR %s' % OTA_LATEST_FILENAME, file.write)
            except:
                logger.error("Could not download new package.", exc_info=True)

            if os.path.isfile(OTA_LATEST_FILENAME):
                logger.info("installing new package and rebooting ...")
                cmd = '/usr/bin/nohup sh -c "gdebi -n %s ; rm %s ; reboot"' % (OTA_LATEST_FILENAME, OTA_LATEST_FILENAME)

                logger.info("%s" % cmd)
                subprocess.Popen(shlex.split(cmd), shell=False, preexec_fn=os.setpgrp)

        threading.Thread(target=ota_and_reboot).start()
        return True

    return False


@app.route("/settings/ota", methods=['GET', 'POST'])
def settings_ota():
    if "username" not in session:
        return redirect(url_for("signin"))

    cfg = app.config["cfg"]

    if request.method == 'POST':
        rf = request.form               # just a shortcut

        try:
            action = request.form["action"]
        except:
            action = ""

        if "Upgrade" == action:
            try:
                # Do the upgrade and set the reboot
                version = rf["version"]
                logger.info("Upgrade to version %s requested" % version)
                ret = execute_software_update(version)
                if ret:
                    return render_template("settings/ota.html", cfg=cfg, require_reboot=True)
            except:
                pass
        elif "Save" in action:
            try:
                value = rf["auto_update.enable"]
                if value not in ["on", "off"]:
                    raise Exception()
                cfg.auto_update.enable = True if value in "on" else False
            except:
                pass

            cfg.save()

    return render_template("settings/ota.html", cfg=cfg, SOFTWARE_VERSION=SOFTWARE_VERSION, require_reboot=False)


def check_software_update():
    global OTA_LATEST_VERSION
    global OTA_LATEST_FILENAME
    logger.info("Checking for ota updates ...")
    ping_result = 0
    ftp = None
    ping_result = verbose_ping("google.com")
    if ping_result:
        try:
            ftp = ftplib.FTP(OTA_SERVER, OTA_SERVER_LOGIN, OTA_SERVER_PASSWORD)
        except:
            logger.error("Could not connect to the ftp server.", exc_info=True)
            return ({"result": False,
                 "msg": "An error occurred when contacting the update server. Please try again later."})
    else:
        logger.error("Could not connect to the ftp server.", exc_info=True)
        return ({"result": False,"msg": "Internet is down, please check your internet connection"})
    
    try:
        files = ftp.nlst()
    except ftplib.error_perm as resp:
        if str(resp) == "550 No files found":
            logger.error("Ftp server seems to host no files", exc_info=True)
            return ({"result": False,
                     "msg": "Could not find any software update."})
        else:
            logger.error("Ftp server seems to host no files", exc_info=True)
            return ({"result": False,
                     "msg": "An error occurred when getting updates from the server. Please try again later."})

    # debug
    candidates = []
    for f in files:
        if ".deb" in f:
            candidates.append(f)
            logger.info("Update Candidate : %s" % f)

    if len(candidates) == 0:
        logger.error("Ftp server seems to host no upgrade files", exc_info=True)
        return ({"result": False,
                 "msg": "Could not find any software update."})

    # get the latest.
    latest = candidates[0].split("_")[-1].split(".deb")[0]
    latest_filename = candidates[0]
    if latest.count("-") > 1:
        latest = latest.split("-")[0] + "-" + latest.split("-")[1]
    for c in candidates:
        cc = c.split("_")[-1].split(".deb")[0]
        if cc.count("-") > 1:
            cc = cc.split("-")[0] + "-" + cc.split("-")[1]

        if parse_version(latest) < parse_version(cc):
            latest = cc
            latest_filename = c

    # compare with current
    current_version = SOFTWARE_VERSION.split("_")[-1].split(".deb")[0]
    if current_version.count("-") > 1:
        current_version = current_version.split("-")[0] + "-" + current_version.split("-")[1]

    if parse_version(current_version) < parse_version(latest):
        logger.info("Software Update found : %s" % latest)
        OTA_LATEST_VERSION = latest
        OTA_LATEST_FILENAME = latest_filename
        return {"result": True, "latest": latest, "msg": "A new software version has been found !"}

    return {"result": False, "latest": latest, "msg": "Your software is up to date."}


@app.route("/check_ota", methods=['GET'])
def check_ota():
    return jsonify(check_software_update())


@app.route("/debug/logs", methods=['GET', 'POST'])
def debug_logs():
    """ Debug logs page.
    """

    if "username" not in session:
        return redirect(url_for("signin"))

    cfg = app.config["cfg"]

    return render_template("debug/logs.html", cfg=cfg)


@app.route('/debug/download_logs')
def debug_download_logs():

    if "username" not in session:
        return redirect(url_for("signin"))

    try:
        # create the zip
        LOGS_ZIP_PATH = '/var/log/lextend_logs.zip'
        zf = zipfile.ZipFile(LOGS_ZIP_PATH, mode='w')
        try:
            for logfile in glob.glob("/var/log/lextend.*"):
                zf.write(logfile, logfile.replace("/var/log/", ""))
        finally:
            zf.close()

        # send the zip
        return send_file(LOGS_ZIP_PATH, as_attachment=True, attachment_filename='lextend_logs.zip')
    except:
        pass


@app.route("/debug/logs_stream", methods=['GET'])
@cross_origin()
def debug_logs_stream():

    if "username" not in session:
        return redirect(url_for("signin"))

    try:
        logfile_id = request.args.get("id")
        if logfile_id == "0":
            logfile_path = "/var/log/lextend.engine.log"
        elif logfile_id == "1":
            logfile_path = "/var/log/lextend.webfrontend.log"
        elif logfile_id == "2":
            logfile_path = "/var/log/lextend.flic.log"
        elif logfile_id == "3":
            logfile_path = "/var/log/lextend.rpi.log"

        def gen():
            with open(logfile_path) as f:
                while True:
                    line = f.readline()
                    if not line:
                        time.sleep(1)
                    yield line

        return flask.Response(gen(), mimetype='text/event-stream')
    except:
        pass


@app.route("/lextend_manual.pdf", methods=['GET'])
@cross_origin()
def documentation():

    if "username" not in session:
        return redirect(url_for("signin"))

    try:
        return app.send_static_file('lextend_manual.pdf')
    except:
        pass


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


def AutoUpdate():
    # wait or the window : 3am to 4am
    logger.info("AutoUpdate background task started")
    now = datetime.datetime.now()
    target = datetime.datetime.now().replace(hour=3, minute=0, second=0)

    dt = (target - now).total_seconds()

    if dt < 0:
        dt += 24*60*60

    # add random for 1 hour
    delay = int(dt + randint(0, 60*60))

    logger.info("AutoUpdate : Waiting %s seconds for next update window." % delay)
    time.sleep(delay)

    if app.config["cfg"]:
        logger.info("AutoUpdate : Starting auto update process.")
        ret = check_software_update()

        if ret["result"] is True:
            execute_software_update(OTA_LATEST_VERSION)
    else:
        logger.info("AutoUpdate : Auto update is disabled. Skipping auto update.")

    # Schedule next auto update
    logger.info("AutoUpdate : Scheduling next update process in 24 hours.")
    t = threading.Timer(24*60*60, AutoUpdate)
    t.start()


def StartAutoUpdateThread():
    t = threading.Timer(0, AutoUpdate)
    t.start()


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
    StartAutoUpdateThread()

    # Create and run the web app.
    app.secret_key = "Ag~EpxZ3&,h28fA.Ze;iZ1EO,F4e5dRZ)"
    app.debug = FLASK_DEBUG
    app.config['MAX_CONTENT_LENGTH'] = FLASK_MAX_UPLOAD_SIZE
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 10  # cache control max age for send_static_file()
    app.run(host=SERVER_ADDRESS,
            port=os.environ.get("USER_DEFINED_PORT_WEB"),
            # debug=True,
            threaded=True,
            use_reloader=FLASK_USE_RELOADER)


if __name__ == "__main__":
    main()
