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
import os
from configuration.xmlsettings import XMLSettings
from lxml import etree

import pyinotify

import logging

import time


class dummy(object):
    pass


class EventHandler(pyinotify.ProcessEvent):
    """ This class is used by inotify to handle filesystem changes events.
    """
    def __init__(self, configManagerInstance):
        super(EventHandler, self).__init__()
        self.configManagerInstance = configManagerInstance

    def process_IN_CLOSE_WRITE(self, event):
        """ This is a callback handler. Used to handle filesystem events.

        It will check for the config_filename CREATED and MODIFIED events,
        and reload the configuration in such cases.
        """
        if self.configManagerInstance.config_filename in event.pathname:
            self.configManagerInstance.loadfile()


class ConfigManager(object):
    """ This class is used to read, write, reset the global config,

        It is used by sonosdoorbell service and by webfrontend.

        Configuration is stored in an XML file.
        Configuration is autoloaded when a file change is detected.

        NOTE: When an exception occurs, the configuration is generally reset
            and is saved again to the XML file. A backup is also created.
    """

    def __init__(self, config_subdir, config_filename, lextend_ip, logger=None):
        """ ConfigManager initializer.

        This function will ensure that folder structure is created.
        It will load (and save to ensure consistency in case of errors) the XML.
        It will then start watching the config_file for changes.
        """
        self.lextend_ip = lextend_ip
        self.logger = logger or logging.getLogger(__name__)

        self.general = None
        self.sonos_doorbell = None
        self.auto_update = None
        self.gpio = None
        self.no_of_flics = 10
        self.flic = None

        self.config = None
        self.config_filename = None
        config_userconfig = os.path.join("/root",
                                         ".config", config_subdir, config_filename)

        # Make sure config_file exists in the config directory.
        try:
            if not os.path.exists(config_userconfig):
                conf_dir = None
                try:
                    conf_dir = os.path.dirname(config_userconfig)
                    os.makedirs(conf_dir)
                except:
                    self.logger.error("Cannot create %s." % conf_dir, exc_info=True)
            self.config_filename = config_userconfig
        except:
            self.logger.error("Could not ensure %s exists." % config_userconfig, exc_info=True)

        # Try to load and save the config file : enforce consistency.
        self.loadfile()
        self.save()

        # Start watching the config file for changes.
        try:
            self.wm = pyinotify.WatchManager()
            mask = pyinotify.EventsCodes.FLAG_COLLECTIONS["OP_FLAGS"]["IN_CLOSE_WRITE"]  # pyinotify.IN_CLOSE_WRITE
            self.notifier = pyinotify.ThreadedNotifier(self.wm, EventHandler(self))
            self.notifier.start()
            self.wdd = self.wm.add_watch(os.path.dirname(self.config_filename), mask, rec=True)
        except:
            self.logger.error("Could not start observe on %s" % self.config_filename,
                              exc_info=True)

    def loadfile(self):
        """ Load config from the XML file, and reset and save in case of error.
        """
        self.logger.info("Loading settings from %s." % self.config_filename)
        try:
            self.config = XMLSettings(self.config_filename)
        except:
            self.logger.error("Could not load Config from %s." % self.config_filename,
                              exc_info=True)
            self.reset()
            self.save()
        self.load()

    def load(self):
        """ Load settings from the config file.
        """

        def load_general():
            section = "General"

            # Prepare the structures
            self.general = dummy()
            self.general.lextend = dummy()
            self.general.wifi = dummy()
            self.general.miniserver = dummy()
            self.general.admin = dummy()

            # read the settings
            lextend_ip = "192.168.1.222"
            if self.lextend_ip != "":
                lextend_ip = self.lextend_ip
            self.general.lextend.ip = self.config.get(section + "/Lextend/ip",
                                                      lextend_ip)
            self.general.lextend.netmask = self.config.get(section + "/Lextend/netmask",
                                                           "255.255.255.0")
            self.general.lextend.gateway = self.config.get(section + "/Lextend/gateway",
                                                           "192.168.1.1")
            self.general.lextend.dns1 = self.config.get(section + "/Lextend/dns1",
                                                        "8.8.8.8")
            self.general.lextend.dns2 = self.config.get(section + "/Lextend/dns2",
                                                        "8.8.4.4")
            self.general.lextend.port = self.config.get(section + "/Lextend/port",
                                                        "5050")

            self.general.miniserver.ip = self.config.get(section + "/Miniserver/ip",
                                                         "192.168.1.230")
            self.general.miniserver.port = self.config.get(section + "/Miniserver/port",
                                                           "5050")
            tmp = self.config.get(section + "/Wifi/enable", "False")
            self.general.wifi.enable = True if "True" in tmp else False
            self.general.wifi.ssid = self.config.get(section + "/Wifi/ssid",
                                                     "alcodex")
            self.general.wifi.password = self.config.get(section + "/Wifi/password",
                                                         "alcodex")
            self.general.admin.name = self.config.get(section + "/Admin/name",
                                                      "admin")
            self.general.admin.password = self.config.get(section + "/Admin/password",
                                                          "admin")

        def load_sonos_doorbell():
            section = "Services/Sonos_Doorbell"

            # Prepare the structures
            self.sonos_doorbell = dummy()

            tmp = self.config.get(section + "/enable", "True")
            self.sonos_doorbell.enable = True if "True" in tmp else False
            tmp = self.config.get(section + "/volume_override", "False")
            self.sonos_doorbell.volume_override = True if "True" in tmp else False
            self.sonos_doorbell.volume = self.config.get(section + "/volume", 50)
            self.sonos_doorbell.default_sound = self.config.get(section + "/default_sound", 0)

            self.sonos_doorbell.sounds_filelist = []
            for i in range(10):
                key = section + "/Sounds/sound_%s" % i
                self.sonos_doorbell.sounds_filelist.append(self.config.get(key, "default sound"))

            self.sonos_doorbell.protocol = self.config.get(section + "/Protocol",
                                                           "10!x1")

            tmp = self.config.get(section + "/Ignore_sonos_names", "False")
            self.sonos_doorbell.ignore_sonos_names = True if "True" in tmp else False

            # Commercials
            self.sonos_doorbell.commercials = dummy()
            tmp = self.config.get(section + "/commercials/volume_override", "True")
            self.sonos_doorbell.commercials.volume_override = True if "True" in tmp else False
            self.sonos_doorbell.commercials.volume = self.config.get(section + "/commercials/volume", 10)

            self.sonos_doorbell.commercials.sounds_filelist = []
            for i in range(10):
                key = section + "/commercials/sounds/sound_%s" % i
                self.sonos_doorbell.commercials.sounds_filelist.append(self.config.get(key, ""))

            # preferred radios feature
            self.sonos_doorbell.saved_radios = []
            for i in range(10):
                key = section + "saved_radios/radio_%s" % i
                self.sonos_doorbell.saved_radios.append(dummy())
                try:
                    self.sonos_doorbell.saved_radios[i].url = self.config.get(key + "/url", "")
                except:
                    self.logger.error("Could not load a setting field.", exc_info=True)
                try:
                    self.sonos_doorbell.saved_radios[i].meta = self.config.get(key + "/meta", "")
                except:
                    self.logger.error("Could not load a setting field.", exc_info=True)
                try:
                    self.sonos_doorbell.saved_radios[i].name = self.config.get(key + "/name", "")
                except:
                    self.logger.error("Could not load a setting field.", exc_info=True)

        def load_auto_update():
            section = "AutoUpdate"

            # Prepare the structures
            self.auto_update = dummy()

            # read the settings
            tmp = self.config.get(section + "/enable", "False")
            self.auto_update.enable = True if "True" in tmp else False

        def load_gpio():
            section = "ExternalIO"

            # Prepare the structures
            self.gpio = dummy()
            self.gpio.udp_payload_rising = []
            self.gpio.udp_payload_falling = []
            for i in range(6):
                key = section + "/udp_payload/gpio_%s_rising" % i
                self.gpio.udp_payload_rising.append(self.config.get(key, "10!1%s5" % (i+1)))
                key = section + "/udp_payload/gpio_%s_falling" % i
                self.gpio.udp_payload_falling.append(self.config.get(key, "10!1%s5" % (i+1)))

            no_of_flics = self.no_of_flics
            self.flic = dummy()
            self.flic.click = []
            self.flic.double_click = []
            self.flic.hold = []
            for i in range(no_of_flics):
                key = section + "/flic_%s/click" % i
                self.flic.click.append(self.config.get(key, "10!1%s5" % (i + 1)))
                key = section + "/flic_%s/double_click" % i
                self.flic.double_click.append(self.config.get(key, "10!1%s5" % (i + 1)))
                key = section + "/flic_%s/hold" % i
                self.flic.hold.append(self.config.get(key, "10!1%s5" % (i + 1)))
            # read the settings

        load_general()
        load_sonos_doorbell()
        load_auto_update()
        load_gpio()

    def save(self):
        """ Save settings to the config file.
        """
        self.logger.info("Saving Config to %s." % self.config_filename)

        def put_general():
            section = "General"
            self.config.put(section + "/version", "1")

            self.config.put(section + "/Lextend/ip", self.general.lextend.ip)
            self.config.put(section + "/Lextend/netmask", self.general.lextend.netmask)
            self.config.put(section + "/Lextend/gateway", self.general.lextend.gateway)
            self.config.put(section + "/Lextend/dns1", self.general.lextend.dns1)
            self.config.put(section + "/Lextend/dns2", self.general.lextend.dns2)
            self.config.put(section + "/Lextend/port", self.general.lextend.port)

            self.config.put(section + "/Miniserver/ip", self.general.miniserver.ip)
            self.config.put(section + "/Miniserver/port", self.general.miniserver.port)

            self.config.put(section + "/Wifi/enable", str(self.general.wifi.enable))
            self.config.put(section + "/Wifi/ssid", self.general.wifi.ssid)
            self.config.put(section + "/Wifi/password", self.general.wifi.password)

            self.config.put(section + "/Admin/name", self.general.admin.name)
            self.config.put(section + "/Admin/password", self.general.admin.password)

        def put_sonos_doorbell():
            section = "Services/Sonos_Doorbell"
            self.config.put(section + "/enable", str(self.sonos_doorbell.enable))
            self.config.put(section + "/volume_override",
                            str(self.sonos_doorbell.volume_override))
            self.config.put(section + "/volume", self.sonos_doorbell.volume)
            self.config.put(section + "/default_sound", self.sonos_doorbell.default_sound)

            for i in range(10):
                self.config.put(section + "/Sounds/sound_%s" % i, self.sonos_doorbell.sounds_filelist[i])

            self.config.put(section + "/Protocol", self.sonos_doorbell.protocol)

            self.config.put(section + "/Ignore_sonos_names", str(self.sonos_doorbell.ignore_sonos_names))

            # Commercials
            self.config.put(section + "/commercials/volume_override", str(self.sonos_doorbell.commercials.volume_override))
            self.config.put(section + "/commercials/volume", str(self.sonos_doorbell.commercials.volume))

            for i in range(10):
                self.config.put(section + "/commercials/sounds/sound_%s" % i, self.sonos_doorbell.commercials.sounds_filelist[i])

            # saved radios
            for i in range(10):
                key = section + "saved_radios/radio_%s" % i
                try:
                    self.config.put(key + "/url", self.sonos_doorbell.saved_radios[i].url)
                except:
                    self.logger.error("Could not save a setting field.", exc_info=True)
                try:
                    self.config.put(key + "/meta", self.sonos_doorbell.saved_radios[i].meta)
                except:
                    self.logger.error("Could not save a setting field.", exc_info=True)
                try:
                    self.config.put(key + "/name", self.sonos_doorbell.saved_radios[i].name)
                except:
                    self.logger.error("Could not save a setting field.", exc_info=True)

        def put_auto_update():
            section = "AutoUpdate"
            self.config.put(section + "/enable", str(self.auto_update.enable))

        def put_gpio():
            section = "ExternalIO"

            # Prepare the structures
            for i in range(6):
                key = section + "/udp_payload/gpio_%s_rising" % i
                self.config.put(key, self.gpio.udp_payload_rising[i])
                key = section + "/udp_payload/gpio_%s_falling" % i
                self.config.put(key, self.gpio.udp_payload_falling[i])

            no_of_flics = self.no_of_flics
            for i in range(no_of_flics):
                key = section + "/flic_%s/click" % i
                self.config.put(key, self.flic.click[i])
                key = section + "/flic_%s/double_click" % i
                self.config.put(key, self.flic.double_click[i])
                key = section + "/flic_%s/hold" % i
                self.config.put(key, self.flic.hold[i])

        put_general()
        put_sonos_doorbell()
        put_auto_update()
        put_gpio()

        try:
            self.config.save()
        except:
            self.logger.error("Could not save settings.", exc_info=True)

        # Lazy attempt to solve the bug with using config before it is loaded again;
        time.sleep(0.5)

    def remove_xml_element(self, element_name):
        try:
            f = open(self.config_filename, "w+")
            # parser = etree.ETCompatXMLParser()
            tree = etree.parse(f)  # , parser
            f.close()

            for element in tree.xpath("//%s" % element_name):
                element.getparent().remove(element)

            fi = open(self.config_filename, "w+r")
            fi.write(etree.tostring(tree))
        except:
            self.logger.error("While removing %s in %s" % (element_name,
                                                           self.config_filename),
                              exc_info=True)

    def reset_service(self, service_name):
        self.remove_xml_element(service_name)
        self.load()
        self.save()

    def reset_general(self):
        self.reset_service("General")

    def reset_sonos_doorbell(self):
        self.reset_service("Sonos_Doorbell")

    def reset(self):
        """ Reset settings and save them to the XML config file.
        """
        self.logger.info("Resetting Config to %s" % self.config_filename)
        try:
            os.rename(self.config_filename, "%s.bak" % self.config_filename)
            self.logger.info("Config file backed up to %s.bak" % self.config_filename)
        except:
            self.logger.warning("reset", exc_info=True)
        try:
            self.config = XMLSettings(self.config_filename)
        except:
            self.config = XMLSettings("")
            self.logger.warning("reset", exc_info=True)
        self.load()
        self.save()
