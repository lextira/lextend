# coding=utf-8
# !/usr/bin/env python2
# import os
# import sys

import socket
# import traceback

from configuration import ConfigManager
from sonosdoorbell import SonosPoolManager
# from sonosdoorbell import SonosDeviceManager

from utils.settings import *
from utils.sounds_utils import *
from utils.ip_utils import *


import threading
from threading import Thread
import rpyc
from rpyc.utils.server import ThreadedServer

from time import sleep
import time

# from Queue import Queue
import re

import logging
import logging.handlers

try:
    import RPi.GPIO as GPIO
except:
    pass

logger = logging.getLogger()
LOG_FILENAME = "/var/log/lextend.engine.log"
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
start = None
end = None


class RPC_Server(Thread):
    """ Wrapper used to run RPC service in a separate thread.
    """
    def __init__(self, sonosManagerInstance):
        Thread.__init__(self)
        self.sonosManagerInstance = sonosManagerInstance

    def run(self):
        thread = ThreadedServer(RPC_Service(self.sonosManagerInstance),
                                port=RPC_PORT,
                                protocol_config={"allow_public_attrs": True})
        thread.start()


def RPC_Service(sonosManagerInstance):
    """ Closure used to pass arguments to RPC_Service_Class(rpyc.Service)
    """
    class RPC_Service_Class(rpyc.Service):
        """ RPC service class, used to expose interfaces and objects to webfrontend.
        """
        def on_connect(self):
            pass

        def on_disconnect(self):
            pass

        def exposed_get_sonosPoolManager(self):
            return sonosManagerInstance

    return RPC_Service_Class


def parseExtensionProtocol(data, cfg):
    """ Parse miniserver udp packet and return parsed data.

    Packet format: HEADER + PARAMETERS

    DoorBell Packet format: HEADER + SOUND + VOLUME
        HEADER : a string of any length
        SOUND  : 1 CHAR, ascii, 1..9
        VOLUME : 1 CHAR, ascii, 1..9
        GROUP1 : 1 CHAR, ascii, 0..9
        GROUP2 : 1 CHAR, ascii, 0..9
        GROUP3 : 1 CHAR, ascii, 0..9

        For groups, 0 has the special meaning of no group.

    Args:
        data (str): Input packet.
        cfg (str): configuration instance, it contains expected headers.

    Returns:
        {"type":"", "params":(parameters)} if successful, None otherwise.
        Examples:
        {"type":"sonos_doorbell", [sound, volume]}
    """
    GeneralFeatures_DoorBell_Protocol                  = "10!1"
    GeneralFeatures_Alarm_Protocol                     = "^11![1-2]"
    GeneralFeatures_LineIn_Protocol                    = "^12![1-2]"
    ZonesFeatures_Commercials_Enable_Protocol          = "13!1"
    ZonesFeatures_Commercials_Disable_Protocol         = "13!2"
    AllSpeakersFeatures_Commercials_Enable_Protocol    = "14!1"
    AllSpeakersFeatures_Commercials_Disable_Protocol   = "14!2"

    ZonesFeatures_Protocol                             = "^[2-3][0-9]!"
    ZonesFeatures_Play_Protocol                        = "^21![1-2]"
    ZonesFeatures_Pause_Protocol                       = "22!1"
    ZonesFeatures_VolUp_Protocol                       = "23!"
    ZonesFeatures_VolDown_Protocol                     = "24!"
    ZonesFeatures_TrackUp_Protocol                     = "25!1"
    ZonesFeatures_TrackDown_Protocol                   = "26!1"
    ZonesFeatures_NextRadioStation_Protocol            = "27!1"
    ZonesFeatures_PreviousRadioStation_Protocol        = "28!1"
    ZonesFeatures_SetVolume_Protocol                   = "29!1"
    ZonesFeatures_SetRadioStation_Protocol             = "30!1"

    AllSpeakersFeatures_Protocol                       = "^[4-5][0-9]!"
    AllSpeakersFeatures_Play_Protocol                  = "^41![1-2]"
    AllSpeakersFeatures_Pause_Protocol                 = "42!1"
    AllSpeakersFeatures_VolUp_Protocol                 = "43!"
    AllSpeakersFeatures_VolDown_Protocol               = "44!"
    AllSpeakersFeatures_TrackUp_Protocol               = "45!1"
    AllSpeakersFeatures_TrackDown_Protocol             = "46!1"
    AllSpeakersFeatures_NextRadioStation_Protocol      = "47!1"
    AllSpeakersFeatures_PreviousRadioStation_Protocol  = "48!1"
    AllSpeakersFeatures_SetVolume_Protocol             = "49!1"
    AllSpeakersFeatures_SetRadioStation_Protocol       = "50!1"

    if data.startswith(GeneralFeatures_DoorBell_Protocol):
        header_len = len(GeneralFeatures_DoorBell_Protocol)
        try:
            args_sound = int(data[header_len])
            if not (1 <= args_sound <= 9):
                return None
            args_volume = (int(data[header_len + 1:]))
            args_volume *= 10
            if not (0 <= args_volume <= 100):
                return None
        except:
            return None

        return {"type": "GeneralFeatures_DoorBell", "params": [args_sound, args_volume]}

    elif re.match(GeneralFeatures_Alarm_Protocol, data):
        header_len = 4
        try:
            function = int(data[header_len-1])
            if not (1 <= function <= 2):
                return None

            if function == 1:
                args_sound = int(data[header_len])
                if not (1 <= args_sound <= 9):
                    return None
                args_volume = (int(data[header_len + 1:]))
                args_volume *= 10
                if not (0 <= args_volume <= 100):
                    return None
            else:
                args_sound = 0
                args_volume = 0
        except:
            return None

        return {"type": "GeneralFeatures_Alarm", "command": function, "params": [args_sound, args_volume]}

    elif re.match(GeneralFeatures_LineIn_Protocol, data):
        header_len = 4
        try:
            function = int(data[header_len-1])
            if not (1 <= function <= 2):
                return None
            if function == 1:
                args_volume = (int(data[header_len:]))
                args_volume *= 10
                if not (0 <= args_volume <= 100):
                    return None
                return {"type": "GeneralFeatures_LineIn", "command": function, "params": [args_volume]}
            else:
                return {"type": "GeneralFeatures_LineIn", "command": function, "params": []}
        except:
            return None

    elif re.match(ZonesFeatures_Commercials_Enable_Protocol, data):
        Ptype = "ZonesFeatures_Commercials_Enable"
        header_len = len(ZonesFeatures_Commercials_Enable_Protocol)

        try:
            args_group1 = int(data[header_len])
            if not (0 <= args_group1 <= 9):
                return None

            try:
                interval = int(data[header_len+1:])
                if not (1 <= interval <= 300):
                    return None
            except:
                return None

            return {"type": Ptype, "params": [[args_group1], interval]}
        except:
            return None

    elif re.match(ZonesFeatures_Commercials_Disable_Protocol, data):
        Ptype = "ZonesFeatures_Commercials_Disable"
        header_len = len(ZonesFeatures_Commercials_Disable_Protocol)

        try:
            args_group1 = int(data[header_len])
            if not (0 <= args_group1 <= 9):
                return None

            return {"type": Ptype, "params": [args_group1]}
        except:
            return None

    elif data.startswith(AllSpeakersFeatures_Commercials_Enable_Protocol):
        Ptype = "AllSpeakersFeatures_Commercials_Enable"
        header_len = len(AllSpeakersFeatures_Commercials_Enable_Protocol)

        try:
            interval = int(data[header_len:])
            if not (1 <= interval <= 300):
                return None
        except:
            return None

        return {"type": Ptype, "params": [interval]}

    elif data.startswith(AllSpeakersFeatures_Commercials_Disable_Protocol):
        Ptype = "AllSpeakersFeatures_Commercials_Disable"
        header_len = len(AllSpeakersFeatures_Commercials_Disable_Protocol)
        return {"type": Ptype}

    elif re.match(ZonesFeatures_Protocol, data):
        header_len = 4
        # Set volume is an exception protocol for ZonesFeatures
        if data.startswith(ZonesFeatures_SetVolume_Protocol):
            Ptype = "ZonesFeatures_SetVolume"
            header_len = len(ZonesFeatures_SetVolume_Protocol)

            try:
                args_group1 = int(data[header_len])
                if not (0 <= args_group1 <= 9):
                    return None

                try:
                    volume_group1 = int(data[header_len+1:])
                    # volume_group1 *= 10
                    if not (0 <= volume_group1 <= 100):
                        return None
                except:
                    return None

                return {"type": Ptype, "params": [args_group1, volume_group1]}
            except:
                return None

        elif data.startswith(ZonesFeatures_SetRadioStation_Protocol):
            Ptype = "ZonesFeatures_SetRadioStation"
            header_len = len(ZonesFeatures_SetRadioStation_Protocol)

            try:
                args_group1 = int(data[header_len])
                if not (0 <= args_group1 <= 9):
                    return None

                try:
                    station_group1 = int(data[header_len+1:])
                    if not (1 <= station_group1 <= 10):
                        return None
                except:
                    return None

                return {"type": Ptype, "params": [args_group1, station_group1-1]}
            except:
                return None

        # Common groups parsing for the rest of the features
        try:
            args_group1 = int(data[header_len])
            if not (0 <= args_group1 <= 9):
                return None
            args_group2 = int(data[header_len+1])
            if not (0 <= args_group2 <= 9):
                return None
            args_group3 = int(data[header_len+2])
            if not (0 <= args_group3 <= 9):
                return None
            args_group4 = int(data[header_len+3])
            if not (0 <= args_group4 <= 9):
                return None
        except:
            return None

        if re.match(ZonesFeatures_Play_Protocol, data):
            Ptype = "ZonesFeatures_Play"
            try:
                function = int(data[header_len-1])
                if not (1 <= function <= 2):
                    return None
            except:
                return None
            if function is 2:
                try:
                    args_group1 = int(data[header_len])
                    if not (1 <= args_group1 <= 9):
                        return None
                    args_group2 = int(data[header_len+1:header_len+3])
                    args_group2 *= 10
                    if not (0 <= args_group2 <= 100):
                        return None
                    args_group3 = int(data[header_len+3])
                    if not (0 <= args_group3 <= 9):
                        return None
                    args_group4 = int(data[header_len+4:])
                    args_group4 *= 10
                    if not (0 <= args_group4 <= 100):
                        return None
                except:
                    return None
            else:
                try:
                    args_group1 = int(data[header_len])
                    if not (0 <= args_group1 <= 9):
                        return None
                    args_group2 = int(data[header_len + 1])
                    if not (0 <= args_group2 <= 9):
                        return None
                    args_group3 = int(data[header_len + 2])
                    if not (0 <= args_group3 <= 9):
                        return None
                    args_group4 = int(data[header_len + 3])
                    if not (0 <= args_group4 <= 9):
                        return None
                except:
                    return None

            return {"type": Ptype, "command": function, "params": [args_group1, args_group2, args_group3, args_group4]}

        elif data.startswith(ZonesFeatures_Pause_Protocol):
            Ptype = "ZonesFeatures_Pause"
        elif data.startswith(ZonesFeatures_VolUp_Protocol):
            header_len = len(ZonesFeatures_VolUp_Protocol)
            Ptype = "ZonesFeatures_VolUp"
            try:
                function = int(data[header_len])
                if not (1 <= function <= 2):
                    return None
            except:
                return None
            return {"type": Ptype, "command": function, "params": [args_group1, args_group2, args_group3, args_group4]}
        elif data.startswith(ZonesFeatures_VolDown_Protocol):
            header_len = len(ZonesFeatures_VolDown_Protocol)
            Ptype = "ZonesFeatures_VolDown"
            try:
                function = int(data[header_len])
                if not (1 <= function <= 2):
                    return None
            except:
                return None
            return {"type": Ptype, "command": function, "params": [args_group1, args_group2, args_group3, args_group4]}
        elif data.startswith(ZonesFeatures_TrackUp_Protocol):
            Ptype = "ZonesFeatures_TrackUp"
        elif data.startswith(ZonesFeatures_TrackDown_Protocol):
            Ptype = "ZonesFeatures_TrackDown"
        elif data.startswith(ZonesFeatures_NextRadioStation_Protocol):
            Ptype = "ZonesFeatures_NextRadioStation"
        elif data.startswith(ZonesFeatures_PreviousRadioStation_Protocol):
            Ptype = "ZonesFeatures_PreviousRadioStation"
        else:
            return None

        return {"type": Ptype, "params": [args_group1, args_group2, args_group3, args_group4]}

    elif re.match(AllSpeakersFeatures_Protocol, data):
        if re.match(AllSpeakersFeatures_Play_Protocol, data):
            header_len = 4
            Ptype = "AllSpeakersFeatures_Play"
            try:
                function = int(data[header_len-1])
                if not (1 <= function <= 2):
                    return None
            except:
                return None
            if function is 1:
                return {"type": Ptype, "command": function, "volume": []}
            elif function is 2:
                try:
                    volume = (int(data[header_len:]))
                    volume *= 10
                    if not (0 <= volume <= 100):
                        return None
                except:
                    return None
                return {"type": Ptype, "command": function, "volume": [volume]}

        elif data.startswith(AllSpeakersFeatures_Pause_Protocol):
            Ptype = "AllSpeakersFeatures_Pause"
        elif data.startswith(AllSpeakersFeatures_VolUp_Protocol):
            header_len = len(AllSpeakersFeatures_VolUp_Protocol)
            Ptype = "AllSpeakersFeatures_VolUp"
            try:
                function = int(data[header_len])
                if not (1 <= function <= 2):
                    return None
            except:
                return None
            return {"type": Ptype, "command": function, "params": []}
        elif data.startswith(AllSpeakersFeatures_VolDown_Protocol):
            header_len = len(AllSpeakersFeatures_VolDown_Protocol)
            Ptype = "AllSpeakersFeatures_VolDown"
            try:
                function = int(data[header_len])
                if not (1 <= function <= 2):
                    return None
            except:
                return None
            return {"type": Ptype, "command": function, "params": []}
        elif data.startswith(AllSpeakersFeatures_TrackUp_Protocol):
            Ptype = "AllSpeakersFeatures_TrackUp"
        elif data.startswith(AllSpeakersFeatures_TrackDown_Protocol):
            Ptype = "AllSpeakersFeatures_TrackDown"
        elif data.startswith(AllSpeakersFeatures_NextRadioStation_Protocol):
            Ptype = "AllSpeakersFeatures_NextRadioStation"
        elif data.startswith(AllSpeakersFeatures_PreviousRadioStation_Protocol):
            Ptype = "AllSpeakersFeatures_PreviousRadioStation"
        elif data.startswith(AllSpeakersFeatures_SetVolume_Protocol):
            Ptype = "AllSpeakersFeatures_SetVolume"
            header_len = len(AllSpeakersFeatures_SetVolume_Protocol)
            try:
                volume = int(data[header_len:])
                # volume *= 10
                if not (0 <= volume <= 100):
                    return None
            except:
                return None
            return {"type": Ptype, "volume": [volume]}
        elif data.startswith(AllSpeakersFeatures_SetRadioStation_Protocol):
            Ptype = "AllSpeakersFeatures_SetRadioStation"
            header_len = len(AllSpeakersFeatures_SetRadioStation_Protocol)
            try:
                station = int(data[header_len:])
                if not (1 <= station <= 10):
                    return None
            except:
                return None
            return {"type": Ptype, "station": [station-1]}
        else:
            return None

        return {"type": Ptype, "params": []}

    # unknown protocol
    else:
        return None


class LextendEngine(object):
    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)
        self.logger.info("Starting Lextend Engine.")

        self.doorbell_thread = None
        self.alarm_thread = None
        self.socket_receiver_thread = None

        self.commercial_thread = None
        self.commercial_thread_event = threading.Event()

        self.announcementStarted = False
        self.alarmStarted = False

        # Load configuration from XML file
        try:
            local_ip = get_local_ip()
        except:
            local_ip = ""
        self.cfg = ConfigManager(CONFIGURATION_SUBDIRECTORY, CONFIGURATION_FILENAME, lextend_ip=local_ip)

        try:
            self.setup_gpios()
        except:
            self.logger.error("Failed to setup gpios.", exc_info=True)

        # Create a sonos manager
        self.sonosPoolManager = SonosPoolManager()
        try:
            self.sonosPoolManager.discover()
        except:
            self.logger.error("Could not start discovering Sonos.")

        # Create a sounds manager
        self.soundsManager = SoundsManager(CONFIGURATION_SUBDIRECTORY)

        # Expose some RPC interfaces for webfrontend
        self.rpc_server_thread = RPC_Server(self.sonosPoolManager)
        self.rpc_server_thread.start()

        # Get aria ip address
        while True:
            Lextend_ip_address = get_local_ip()
            if Lextend_ip_address == "":
                self.logger.error("FATAL: Cannot get my IP address. Retrying in 10s.")
                sleep(10)
            else:
                self.logger.info("Detected IP address : %s" % Lextend_ip_address)
                break

        self.CIFS_HEADER = "x-file-cifs://" + Lextend_ip_address + "/sonos_share/"
        self.CIFS_HEADER_CUSTOM = "x-file-cifs://" + Lextend_ip_address + "/sonos_share/smb/"
        self.CIFS_HEADER_COMMERCIALS = "x-file-cifs://" + Lextend_ip_address + "/"

        # Start listening to miniserver.
        self.sock = None
        while self.sock is None:
            try:
                self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                self.sock.bind(("", UDP_PORT))
            except Exception:
                # NOTE : the common error is : 98 : address already in use.
                self.logger.error("Failed to create socket, retrying in 10 seconds.", exc_info=True)
                sleep(10)

    def set_network(self):
        """ Set /etc/network/interfaces settings from loaded settings.
        """
        if self.cfg.general.lextend.wifi.enable == True:

            if self.cfg.general.wifi_static.enable == True:
                # static
                change_wifi_static(self.cfg.general.wifi_static.ip, self.cfg.general.wifi_static.netmask,
                                       self.cfg.general.wifi_static.gateway, self.cfg.general.wifi_static.dns1,
                                       self.cfg.general.wifi_static.dns2)

            elif self.cfg.general.wifi_static.enable == False:
                # dhcp
                change_wifi_dhcp()
                change_wpa_supplicant(self.cfg.general.wifi_dhcp.ssid, self.cfg.general.wifi_dhcp.password)

        elif self.cfg.general.lextend.wifi.enable == False:

            if self.cfg.general.lextend.enable == True:

                change_ethernet_static(self.cfg.general.lextend.ip, self.cfg.general.lextend.netmask,
                                       self.cfg.general.lextend.gateway, self.cfg.general.lextend.dns1,
                                       self.cfg.general.lextend.dns2)

            elif self.cfg.general.lextend.enable == False:
                change_ethernet_dhcp()

    def reset_do(self):
        self.logger.info("GPIO: config reset.")
        self.cfg.lextend_ip = "192.168.1.222"  # Force reset of ip address too.
        self.cfg.reset()
        # blink status led
        for x in range(10):
            GPIO.output(STATUS_LED_PIN, 0)
            sleep(0.2)
            GPIO.output(STATUS_LED_PIN, 1)
            sleep(0.2)

        logger.info("setting network config")
        self.set_network()

        logger.info("rebooting in 2 seconds ...")
        time.sleep(2)
        logger.info("rebooting now")
        os.system("reboot")

    def reset_but_callback(self, channel):
        global start
        global end

        self.logger.info("GPIO: reset button triggered.")

        if GPIO.input(CONFIG_RESET_BUTTON_PIN) == 0:
            self.logger.info("GPIO: reset button low.")
            start = time.time()

        if GPIO.input(CONFIG_RESET_BUTTON_PIN) == 1:
            self.logger.info("GPIO: reset button high.")
            end = time.time()
            elapsed = end - start

            if elapsed > CONFIG_RESET_HOLD_TIME_SEC:
                self.reset_do()
            else:
                self.logger.info("GPIO: config reset pressed, bu was not long enough.")

    def pin_cb_both(self, channel):
        # gpios = [33, 35, 36, 37, 38, 40]
        # new mapping after test with pcb corresponds to P1..P6
        gpios = [33, 40, 38, 36, 37, 35]

        try:
            i = gpios.index(channel)

            if GPIO.input(channel) == 0:  # inverse logic on the pcb
                rising = True
                self.logger.info("GPIO: triggered on rising edge. channel %s" % channel)
                packet = self.cfg.gpio.udp_payload_rising[i]
            else:
                rising = False
                self.logger.info("GPIO: triggered on falling edge. channel %s" % channel)
                packet = self.cfg.gpio.udp_payload_falling[i]

            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            if len(packet) > 0:
                self.logger.info("GPIO: sending %s to lo" % packet)
                sock.sendto(packet, ("0.0.0.0", 5050))
        except:
            self.logger.error("GPIO no supported.", exc_info=True)

    def setup_gpios(self):
        self.logger.info("Setting up GPIOs")
        GPIO.cleanup()
        GPIO.setmode(GPIO.BOARD)

        # Status LED
        GPIO.setup(STATUS_LED_PIN, GPIO.OUT)
        GPIO.output(STATUS_LED_PIN, 0)

        # Long press (5 seconds) on RESET BUTTON (31), resets config.
        GPIO.setup(CONFIG_RESET_BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.add_event_detect(CONFIG_RESET_BUTTON_PIN, GPIO.BOTH, callback=self.reset_but_callback, bouncetime=200)

        # Input gpios
        gpios = [33, 35, 36, 37, 38, 40]

        for i in range(6):
            self.logger.info("GPIO PIN%s => falling: %s, rising: %s" % (gpios[i], self.cfg.gpio.udp_payload_falling[i], self.cfg.gpio.udp_payload_rising[i]))
            GPIO.setup(gpios[i], GPIO.IN, pull_up_down=GPIO.PUD_UP)
            GPIO.add_event_detect(gpios[i], GPIO.BOTH, callback=self.pin_cb_both, bouncetime=200)

    def commercials_loop(self, freq=None, vol=None, cgroups=None):
        if freq:
            frequency = freq
        else:
            frequency = 10  # by default hardcoded value of frequency.

        while not self.commercial_thread_event.isSet():
            commercial_filename = self.soundsManager.get_random_commercial_path()
            if commercial_filename:
                split = os.path.split(commercial_filename)
                sound_file = os.path.join(os.path.split(split[0])[1], split[1])
                smb_path = self.CIFS_HEADER_COMMERCIALS + sound_file
                self.logger.info("commercial : Playing %s, %s, %s" % (sound_file, smb_path, cgroups))

                if self.doorbell_thread:
                    if self.doorbell_thread.isAlive():
                        self.logger.info("Dropping commercial because it's already playing")
                        continue
                if cgroups is None:
                    cgroups = []
                if cgroups:
                    sfx = "-Z"
                else:
                    sfx = None

                if vol:
                    volume = vol
                else:
                    volume = self.cfg.sonos_doorbell.commercials.volume

                # override
                if self.cfg.sonos_doorbell.commercials.volume_override:
                    volume = self.cfg.sonos_doorbell.commercials.volume

                self.doorbell_thread = self.sonosPoolManager.pause_play_bell_resume(smb_path, volume,
                                                                                    groups=cgroups, splitter=sfx,
                                                                                    ignore_sonos_names_enabled=False)

                self.logger.info("starting thread %s " % self.doorbell_thread)
                self.doorbell_thread.start()
                self.doorbell_thread.join()
            else:
                self.logger.error("No Commercials found")

            if not self.commercial_thread_event.isSet():
                self.logger.info("Commercial. Waiting for %s min." % frequency)
                self.commercial_thread_event.wait(60*frequency)

            self.logger.info("Commercial. Thread end.")

    def run(self):
        self.socket_receiver_thread = Thread(target=self.socket_receiver, args=())
        self.socket_receiver_thread.setDaemon(True)
        self.socket_receiver_thread.start()

        GPIO.output(STATUS_LED_PIN, 1)

        # Threads shouldn't stop
        self.socket_receiver_thread.join()

    def socket_receiver(self):
        self.logger.info("Started listening on UDP port %s" % UDP_PORT)
        # t = None
        while True:
            data, addr = self.sock.recvfrom(UDP_PORT)
            # drop the packet if there is a bell in progress.
            # if t:
            #  if t.isAlive():
            #    self.logger.info("Dropping packet: bell in progress.")
            #    continue
            try:
                ret = parseExtensionProtocol(data, str(self.cfg))
                if ret:
                    if ret["type"] in "GeneralFeatures_Alarm":
                        if ret["command"] == 1:  # start
                            sound = ret["params"][0]
                            volume = ret["params"][1]
                            # Calculate volume percentage from protocol input.
                            # volume = volume * 11            # [0,9] => [0-100]
                            # Search for the sound in uploads and fallback to defaults.
                            if self.cfg.sonos_doorbell.default_sound != 0:
                                sound = self.cfg.sonos_doorbell.default_sound

                            default_sound = True
                            if "default sound" != self.cfg.sonos_doorbell.sounds_filelist[sound-1]:
                                default_sound = False
                            sound_file = self.soundsManager.search_path_by_index(sound, default_sound)
                            if default_sound:
                                if sound_file:
                                    split = os.path.split(sound_file)
                                    sound_file = os.path.join(os.path.split(split[0])[1], split[1])
                                    smb_path = self.CIFS_HEADER + sound_file
                                    self.logger.info("Alarm : Playing %s, %s, %s." % (sound_file, smb_path, volume))

                                    self.logger.info("Alarm : Start")
                                    # stop doorbell thread if it is running,
                                    # other commands do not use threading and long processes
                                    if self.doorbell_thread:
                                        if self.doorbell_thread.isAlive():
                                            # self.doorbell_thread.stop()
                                            self.doorbell_thread.join()
                                    if self.alarmStarted == False:
                                        # start alarm
                                        self.alarm_thread = self.sonosPoolManager.alarm_start(smb_path, volume)
                                        self.alarm_thread.start()
                                        self.alarmStarted = True
                                else:
                                    self.logger.error("Couldn't locate a sound @ index : %s" % sound)
                            else:
                                if sound_file:
                                    split = os.path.split(sound_file)
                                    sound_file = os.path.join(os.path.split(split[0])[1], split[1])
                                    smb_path = self.CIFS_HEADER_CUSTOM + sound_file
                                    self.logger.info("Alarm : Playing %s, %s, %s." % (sound_file, smb_path, volume))

                                    self.logger.info("Alarm : Start")
                                    # stop doorbell thread if it is running,
                                    # other commands do not use threading and long processes
                                    if self.doorbell_thread:
                                        if self.doorbell_thread.isAlive():
                                            # self.doorbell_thread.stop()
                                            self.doorbell_thread.join()
                                    if self.alarmStarted == False:
                                        # start alarm
                                        self.alarm_thread = self.sonosPoolManager.alarm_start(smb_path, volume)
                                        self.alarm_thread.start()
                                        self.alarmStarted = True
                                else:
                                    self.logger.error("Couldn't locate a sound @ index : %s" % sound)
                        else:  # stop
                            self.logger.info("Alarm : Stop")
                            if self.alarm_thread:
                                if self.alarm_thread.isAlive():
                                    self.alarm_thread.stop()
                                    self.alarm_thread.join()
                            self.sonosPoolManager.alarm_stop()
                            self.alarmStarted = False
                    else:
                        if self.alarm_thread:
                            if self.alarm_thread.isAlive():
                                self.logger.info("Dropping other commands. Alarm is in progress.")
                                continue
                        
                        if ret["type"] in "GeneralFeatures_LineIn":
                            if ret["command"] == 1:
                                volume = ret["params"][0]
                                self.sonosPoolManager.annoucementStart(volume)
                                self.announcementStarted = True
                            else:
                                if self.announcementStarted:
                                    self.sonosPoolManager.annoucementStop()
                                    self.announcementStarted = False
                        elif ret["type"] in "GeneralFeatures_DoorBell":
                            if self.cfg.sonos_doorbell.enable:
                                sound = ret["params"][0]
                                volume = ret["params"][1]
                                # Calculate volume percentage from protocol input.
                                # volume = volume * 11            # [0,9] => [0-100]
                                # Apply configured volume override.
                                if self.cfg.sonos_doorbell.volume_override:
                                    volume = self.cfg.sonos_doorbell.volume
                                # Search for the sound in uploads and fallback to defaults.
                                if self.cfg.sonos_doorbell.default_sound != 0:
                                    sound = self.cfg.sonos_doorbell.default_sound

                                default_sound = True
                                if "default sound" != self.cfg.sonos_doorbell.sounds_filelist[sound-1]:
                                    default_sound = False
                                sound_file = self.soundsManager.search_path_by_index(sound, default_sound)
                                if default_sound:
                                    if sound_file:
                                        split = os.path.split(sound_file)
                                        sound_file = os.path.join(os.path.split(split[0])[1], split[1])
                                        smb_path = self.CIFS_HEADER + sound_file
                                        self.logger.info("Playing %s, %s, %s." % (sound_file, smb_path, volume))
                                        # create sonos list from active groups.
                                        # self.logger.info("Groups: %s, %s, %s." % (group1, group2, group3))

                                        if self.doorbell_thread:
                                            if self.doorbell_thread.isAlive():
                                                self.logger.info("Dropping doorbell because it's already playing")
                                                continue

                                        self.doorbell_thread = self.sonosPoolManager.pause_play_bell_resume(smb_path,
                                                                                                            volume,
                                                                                                            suffix="-DB",
                                                                                                            ignore_sonos_names_enabled=self.cfg.sonos_doorbell.ignore_sonos_names)
                                        self.doorbell_thread.start()
                                    else:
                                        self.logger.error("Couldn't locate a sound @ index : %s" % sound)
                                else:
                                    if sound_file:
                                        split = os.path.split(sound_file)
                                        sound_file = os.path.join(os.path.split(split[0])[1], split[1])
                                        smb_path = self.CIFS_HEADER_CUSTOM + sound_file
                                        self.logger.info("Playing %s, %s, %s." % (sound_file, smb_path, volume))
                                        # create sonos list from active groups.
                                        # self.logger.info("Groups: %s, %s, %s." % (group1, group2, group3))

                                        if self.doorbell_thread:
                                            if self.doorbell_thread.isAlive():
                                                self.logger.info("Dropping doorbell because it's already playing")
                                                continue

                                        self.doorbell_thread = self.sonosPoolManager.pause_play_bell_resume(smb_path,
                                                                                                            volume,
                                                                                                            suffix="-DB",
                                                                                                            ignore_sonos_names_enabled=self.cfg.sonos_doorbell.ignore_sonos_names)
                                        self.doorbell_thread.start()
                                    else:
                                        self.logger.error("Couldn't locate a sound @ index : %s" % sound)
                            else:
                                self.logger.info("SonosDoorbell feature disabled !")

                        elif ret["type"] in "AllSpeakersFeatures_Play":
                            command = ret["command"]
                            volume = None
                            if command is 2:
                                volume = ret["volume"][0]
                            saved_radio = self.cfg.sonos_doorbell.saved_radios[0]
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.play_track_or_radio(ruri=saved_radio.url, rmeta=saved_radio.meta,
                                                                      command=command, volume=volume)

                        elif ret["type"] in "AllSpeakersFeatures_Pause":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.pause()

                        elif ret["type"] in "AllSpeakersFeatures_VolUp":
                            command = ret["command"]
                            if command == 1:
                                percentage = 1
                            elif command == 2:
                                percentage = 5

                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.volup(percentage=percentage)

                        elif ret["type"] in "AllSpeakersFeatures_VolDown":
                            command = ret["command"]
                            if command == 1:
                                percentage = 1
                            elif command == 2:
                                percentage = 5

                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.voldown(percentage=percentage)

                        elif ret["type"] in "AllSpeakersFeatures_TrackUp":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.previous()

                        elif ret["type"] in "AllSpeakersFeatures_TrackDown":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.next()

                        elif ret["type"] in "AllSpeakersFeatures_NextRadioStation":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.nextRadio()

                        elif ret["type"] in "AllSpeakersFeatures_PreviousRadioStation":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.previousRadio()

                        elif ret["type"] in "AllSpeakersFeatures_SetVolume":
                            try:
                                volume = int(ret["volume"][0])

                                if self.announcementStarted:
                                    continue
                                else:
                                    self.sonosPoolManager.volset(volume)
                            except:
                                self.logger.error("SetVolume protocol error %s" % ret["params"])

                        elif ret["type"] in "AllSpeakersFeatures_SetRadioStation":
                            try:
                                station = int(ret["station"][0])
                                saved_radio = self.cfg.sonos_doorbell.saved_radios[station]
                                if saved_radio.url:

                                    if self.announcementStarted:
                                        continue
                                    else:
                                        self.sonosPoolManager.play_uri(saved_radio.url, saved_radio.meta)
                            except:
                                self.logger.error("SetRadio protocol error %s" % ret["station"])
                        elif ret["type"] in "AllSpeakersFeatures_Commercials_Enable":
                            try:
                                self.logger.info("Commercials Enable protocol.")
                                if self.commercial_thread:
                                    if self.commercial_thread.isAlive():
                                        self.logger.info("Commercial is already enabled")
                                        continue

                                self.commercial_thread_event.clear()

                                if self.announcementStarted:
                                    continue
                                else:
                                    self.commercial_thread = threading.Thread(target=self.commercials_loop, args=(ret["params"][0], None, []))
                                    self.commercial_thread.start()
                            except:
                                self.logger.error("Commercials Enable error.")
                        elif ret["type"] in "AllSpeakersFeatures_Commercials_Disable":
                            try:
                                self.logger.info("Commercials Disable protocol.")
                                if self.announcementStarted:
                                    continue
                                else:
                                    self.commercial_thread_event.set()
                            except:
                                self.logger.error("Commercials Disable error.")

                        elif ret["type"] in "ZonesFeatures_Commercials_Enable":
                            try:
                                self.logger.info("Commercials Enable protocol.")
                                if self.commercial_thread:
                                    if self.commercial_thread.isAlive():
                                        self.logger.info("Commercial is already enabled")
                                        continue

                                self.commercial_thread_event.clear()

                                if self.announcementStarted:
                                    continue
                                else:
                                    self.commercial_thread = threading.Thread(target=self.commercials_loop, args=(ret["params"][1], None, ret["params"][0]))
                                    self.commercial_thread.start()
                            except:
                                self.logger.error("Commercials Enable error.")
                        elif ret["type"] in "ZonesFeatures_Commercials_Disable":
                            try:
                                self.logger.info("Commercials Disable protocol.")
                                if self.announcementStarted:
                                    continue
                                else:
                                    self.commercial_thread_event.set()
                            except:
                                self.logger.error("Commercials Disable error.")

                        elif ret["type"] in "ZonesFeatures_Play":
                            command = ret["command"]
                            saved_radio = self.cfg.sonos_doorbell.saved_radios[0]
                            if self.announcementStarted:
                                continue
                            else:
                                if command is 1:
                                    self.sonosPoolManager.play_track_or_radio(groups=ret["params"], splitter="-Z",
                                                                              ruri=saved_radio.url,
                                                                              rmeta=saved_radio.meta, command=command)
                                elif command is 2:
                                    for i in range(1, 4, 2):
                                        volume = ret["params"][i]
                                        zone = [ret["params"][i-1]]
                                        self.sonosPoolManager.play_track_or_radio(groups=zone, splitter="-Z",
                                                                                  ruri=saved_radio.url,
                                                                                  rmeta=saved_radio.meta, command=command,
                                                                                  volume=volume)

                        elif ret["type"] in "ZonesFeatures_Pause":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.pause(ret["params"], "-Z")

                        elif ret["type"] in "ZonesFeatures_VolUp":
                            command = ret["command"]
                            if command == 1:
                                percentage = 1
                            elif command == 2:
                                percentage = 5

                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.volup(ret["params"], "-Z", percentage=percentage)

                        elif ret["type"] in "ZonesFeatures_VolDown":
                            command = ret["command"]
                            if command == 1:
                                percentage = 1
                            elif command == 2:
                                percentage = 5

                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.voldown(ret["params"], "-Z", percentage=percentage)

                        elif ret["type"] in "ZonesFeatures_TrackUp":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.previous(ret["params"], "-Z")

                        elif ret["type"] in "ZonesFeatures_TrackDown":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.next(ret["params"], "-Z")

                        elif ret["type"] in "ZonesFeatures_NextRadioStation":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.nextRadio(ret["params"], "-Z")

                        elif ret["type"] in "ZonesFeatures_PreviousRadioStation":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.previousRadio(ret["params"], "-Z")

                        elif ret["type"] in "ZonesFeatures_SetVolume":
                            if self.announcementStarted:
                                continue
                            else:
                                self.sonosPoolManager.volset(ret["params"][1], [ret["params"][0]], "-Z")

                        elif ret["type"] in "ZonesFeatures_SetRadioStation":
                            try:
                                saved_radio = self.cfg.sonos_doorbell.saved_radios[ret["params"][1]]
                                if saved_radio.url:
                                    if self.announcementStarted:
                                        continue
                                    else:
                                        self.sonosPoolManager.play_uri(saved_radio.url, saved_radio.meta, [ret["params"][0]], "-Z")
                            except:
                                self.logger.error("SetRadio protocol error %s" % ret["station"])

                        else:
                            self.logger.error("Packet type not known : %s" % ret["type"])
                else:
                    self.logger.warn("Can't decode this packet : %s" % data)
            except:
                self.logger.error("In main loop : ", exc_info=True)


def hw_authenticate():
    hwaddr = open('/sys/class/net/eth0/address').read().replace(':', '').replace('\n', '')[-6:].lower()
    hostname = socket.gethostname().lower()

    if hwaddr not in hostname:
        logger.error("Self destruct!", exc_info=True)
        # os.system("dpkg --purge --force-all lextend")
        # sys.exit()


def main():
    # Software protection mechanism
    # If the LSB(mac address) != hostname than remove myself.
    # hw_authenticate()

    Lextend_engine = LextendEngine()
    Lextend_engine.run()

if __name__ == "__main__":
    main()
