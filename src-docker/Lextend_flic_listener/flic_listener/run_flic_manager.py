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

# !/usr/bin/env python3
import rpyc
from rpyc.utils.server import ThreadedServer
from threading import Thread

from flic.fliclib import *
from configuration import ConfigManager
from utils import *

import logging
import logging.handlers

logger = logging.getLogger()
LOG_FILENAME = "/var/log/lextend.flic.log"
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


class RPC_Server(Thread):
    """ Wrapper used to run RPC service in a separate thread.
    """
    def __init__(self, flicManagerInstance):
        Thread.__init__(self)
        self.flicManagerInstance = flicManagerInstance

    def run(self):
        thread = ThreadedServer(RPC_Service(self.flicManagerInstance),
                                port=RPC_PORT,
                                protocol_config={"allow_public_attrs": True})
        thread.start()


def RPC_Service(flicManagerInstance):
    """ Closure used to pass arguments to RPC_Service_Class(rpyc.Service)
    """
    class RPC_Service_Class(rpyc.Service):
        """ RPC service class, used to expose interfaces and objects to webfrontend.
        """
        def on_connect(self):
            pass

        def on_disconnect(self):
            pass

        def exposed_get_flicPoolManager(self):
            return flicManagerInstance

    return RPC_Service_Class


class FlicManager(Thread):
    """
    Class that handles a pool of flic buttons
    """
    def __init__(self, ip, logger=None):

        threading.Thread.__init__(self)

        self.logger = logger or logging.getLogger(__name__)
        self.ip = ip
        self.flic = FlicClient(self.ip)

        self.flic_name = []
        self.my_bd_addr = ""
        self.no_of_flics = 0
        self.bd_addr_button = []
        self.button_status = {}
        self.flic_status = 0

        self.cfg = ConfigManager(CONFIGURATION_SUBDIRECTORY, CONFIGURATION_FILENAME, lextend_ip=self.ip)

    def run(self):
        scanner = ButtonScanner()
        scanner.on_advertisement_packet = self.on_adv_packet
        self.flic.add_scanner(scanner)

        self.flic.handle_events()

    def status(self, channel, connection_status, disconnect_reason):
        """
        Get status of a button
        :param channel:
        :param connection_status:
        :param disconnect_reason:
        :return:
        """
        for i in range(len(self.bd_addr_button)):
            if channel.bd_addr == self.bd_addr_button[i]:
                if connection_status == ConnectionStatus.Disconnected:
                    self.button_status[channel.bd_addr] = (str(connection_status.name) + ", "
                                                           + str(disconnect_reason.name))
                else:
                    self.button_status[channel.bd_addr] = (str(connection_status.name))

    def got_button(self, bd_addr):
        """
        Create a channel for each button with bd_addr
        :param bd_addr: bluetooth address of button
        :return:
        """
        self.logger.info("Creating button connection channel for %s" % bd_addr)
        cc = ButtonConnectionChannel(bd_addr)
        cc.on_button_single_or_double_click_or_hold = self.sonos_controller
        cc.on_connection_status_changed = self.status
        self.flic.add_connection_channel(cc)

    def got_info(self, items):
        """
        Get flic button info
        :param items: Dictionary that holds flic details
        :return:
        """
        self.logger.info("Getting button info")
        self.my_bd_addr = items['my_bd_addr']
        self.no_of_flics = items["nb_verified_buttons"]

    def sonos_controller(self, channel, click_type, was_queued, time_diff):
        """
        Depending on the click type call the commands that are saved in cfg file
        :param channel: channel
        :param click_type: click type
        :param was_queued: was queued or not
        :param time_diff:
        :return:
        """
        self.logger.info("Calling command")

        for i in range(len(self.bd_addr_button)):

            if channel.bd_addr == self.bd_addr_button[i]:
                try:
                    packet = None
                    if click_type == ClickType.ButtonSingleClick:
                        self.logger.info("%s playing command %s for ButtonSingleClick"
                                         % (self.bd_addr_button[i], self.cfg.flic.click[i]))
                        packet = self.cfg.flic.click[i]
                    elif click_type == ClickType.ButtonDoubleClick:
                        self.logger.info("%s playing command %s for ButtonDoubleClick"
                                         % (self.bd_addr_button[i], self.cfg.flic.double_click[i]))
                        packet = self.cfg.flic.double_click[i]
                    elif click_type == ClickType.ButtonHold:
                        self.logger.info("%s playing command %s for ButtonHold"
                                         % (self.bd_addr_button[i], self.cfg.flic.hold[i]))
                        packet = self.cfg.flic.hold[i]
                    while True:
                        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                        sock.sendto(bytes(packet, "utf-8"), ("localhost", UDP_PORT))
                        break
                except Exception:
                    self.logger.error("Couldn't recognize the click type")

    def get_flic_name(self, name):
        """
        Get flic button's name
        :param name:
        :return:
        """
        if name not in self.flic_name:
            self.flic_name.append(name)
        self.logger.info("FLIC NAME %s" % self.flic_name)

    def done(self, bd_addr):
        """
        Closes the client
        :param bd_addr:
        :return:
        """
        self.flic_status = 2
        self.logger.info("Button " + bd_addr + " was successfully added!")
        # self.flic.close()

    def on_adv_packet(self, scanner, bd_addr, name, rssi, is_private, already_verified):
        """
        Controls all flic buttons depending on the status of the button
        :param scanner:
        :param bd_addr: bluetooth address of flic button
        :param name: name of flic button
        :param rssi:
        :param is_private: flag that checks whether flic button is private or not
        :param already_verified: flag that checks whether flic button is verified or not
        :return:
        """
        # self.flic_status = 0
        # print("On adv packet")
        if already_verified:

            if bd_addr not in self.bd_addr_button:
                self.bd_addr_button.append(bd_addr)
                self.get_flic_name(name)
                self.flic.get_info(self.got_info)
                self.got_button(bd_addr)

            return

        if is_private:
            self.flic_status = 1
            self.logger.info("Button " + bd_addr + " is currently private. "
                                                   "Hold it down for 7 seconds to make it public.")
            return

        self.logger.info("Found public button " + bd_addr + ", now connecting...")
        self.flic.remove_scanner(scanner)

        def restart_scan():
            self.logger.info("Restarting scan")
            self.flic.add_scanner(scanner)

        def on_create(channel, error, connection_status):
            self.logger.info("Channel response on creation")
            if connection_status == ConnectionStatus.Ready:
                self.done(bd_addr)
                # self.flic_status = 2
                # self.logger.info("Button added successfully: ")
            elif error != CreateConnectionChannelError.NoError:
                self.flic_status = 3
                self.logger.error("Button add failed: " + str(error))
                restart_scan()
            else:
                self.flic.set_timer(30 * 1000, lambda: self.flic.remove_connection_channel(channel))

        def on_removed(channel, removed_reason):
            self.logger.error("Failed: " + str(removed_reason))
            restart_scan()

        def on_connection_status_changed(channel, connection_status, disconnect_reason):
            self.logger.info("Connection status changed")
            if connection_status == ConnectionStatus.Ready:
                self.done(bd_addr)

        channel = ButtonConnectionChannel(bd_addr)
        channel.on_create_connection_channel_response = on_create
        channel.on_removed = on_removed
        channel.on_connection_status_changed = on_connection_status_changed
        self.flic.add_connection_channel(channel)


if __name__ == "__main__":

    logger.info("Starting Flic Listener.")

    try:
        local_ip = get_local_ip()
    except:
        local_ip = ""

    flic = FlicManager(local_ip)
    rpc_server_thread = RPC_Server(flic)
    rpc_server_thread.start()
