# coding=utf-8
import os
from xmlsettings import XMLSettings
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

            # self.general.static = dummy()
            self.general.miniserver = dummy()
            self.general.admin = dummy()

            self.general.lextend.wifi = dummy()
            self.general.wifi_static = dummy()
            self.general.wifi_dhcp = dummy()
            self.general.sheduled_reboot = dummy()

            # read the settings
            lextend_ip = "192.168.1.222"
            if self.lextend_ip != "":
                lextend_ip = self.lextend_ip
            # ethernet

            tmp = self.config.get(section + "/Lextend/WiFi/enable", "False")
            self.general.lextend.wifi.enable = True if "True" in tmp else False

            tmp1 = self.config.get(section + "/Lextend/Ethernet/Static/enable", "True")
            self.general.lextend.enable = True if "True" in tmp1 else False

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

            self.general.admin.name = self.config.get(section + "/Admin/name",
                                                      "admin")
            self.general.admin.password = self.config.get(section + "/Admin/password",
                                                          "admin")

            tmp2 = self.config.get(section + "/WiFi/Static/enable", "False")
            self.general.wifi_static.enable = True if "True" in tmp2 else False
            # static
            self.general.wifi_static.ip = self.config.get(section + "/WiFi/Static/ip",
                                                      lextend_ip)
            self.general.wifi_static.netmask = self.config.get(section + "/WiFi/Static/netmask",
                                                           "255.255.255.0")
            self.general.wifi_static.gateway = self.config.get(section + "/WiFi/Static/gateway",
                                                           "192.168.1.1")
            self.general.wifi_static.dns1 = self.config.get(section + "/WiFi/Static/dns1",
                                                        "8.8.8.8")
            self.general.wifi_static.dns2 = self.config.get(section + "/WiFi/Static/dns2",
                                                        "8.8.4.4")
            self.general.wifi_static.port = self.config.get(section + "/WiFi/Static/port",
                                                        "5051")

            self.general.wifi_static.ssid = self.config.get(section + "/WiFi/Static/ssid",
                                                               "alcodex")
            self.general.wifi_static.password = self.config.get(section + "/WiFi/Static/password",
                                                                   "alcodex")

            # dhcp
            self.general.wifi_dhcp.ssid = self.config.get(section + "/WiFi/Dhcp/ssid",
                                                               "alcodex1")
            self.general.wifi_dhcp.password = self.config.get(section + "/WiFi/Dhcp/password",
                                                                   "alcodex1")
            tmp3 = self.config.get(section + "/Sheduled/Reboot/enable", "False")
            self.general.sheduled_reboot.enable= True if "True" in tmp3 else False

            self.general.sheduled_reboot.time = self.config.get(section + "/Sheduled/Reboot/time",
                                                      "12.00")
            self.general.sheduled_reboot.timezone = self.config.get(section + "/Sheduled/Reboot/timezone",
                                                               "Select TIMEZONE")
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

            # ethernet
            self.config.put(section + "/Lextend/WiFi/enable", str(self.general.lextend.wifi.enable))
            self.config.put(section + "/Lextend/Ethernet/Static/enable", str(self.general.lextend.enable))
            self.config.put(section + "/Lextend/ip", self.general.lextend.ip)
            self.config.put(section + "/Lextend/netmask", self.general.lextend.netmask)
            self.config.put(section + "/Lextend/gateway", self.general.lextend.gateway)
            self.config.put(section + "/Lextend/dns1", self.general.lextend.dns1)
            self.config.put(section + "/Lextend/dns2", self.general.lextend.dns2)
            self.config.put(section + "/Lextend/port", self.general.lextend.port)

            self.config.put(section + "/Miniserver/ip", self.general.miniserver.ip)
            self.config.put(section + "/Miniserver/port", self.general.miniserver.port)

            # static
            self.config.put(section + "/WiFi/Static/enable", str(self.general.wifi_static.enable))
            self.config.put(section + "/WiFi/Static/ip", self.general.wifi_static.ip)
            self.config.put(section + "/WiFi/Static/netmask", self.general.wifi_static.netmask)
            self.config.put(section + "/WiFi/Static/gateway", self.general.wifi_static.gateway)
            self.config.put(section + "/WiFi/Static/dns1", self.general.wifi_static.dns1)
            self.config.put(section + "/WiFi/Static/dns2", self.general.wifi_static.dns2)
            self.config.put(section + "/WiFi/Static/port", self.general.wifi_static.port)

            self.config.put(section + "/WiFi/Static/ssid", self.general.wifi_static.ssid)
            self.config.put(section + "/WiFi/Static/password", self.general.wifi_static.password)

            # dhcp
            self.config.put(section + "/WiFi/Dhcp/ssid", self.general.wifi_dhcp.ssid)
            self.config.put(section + "/WiFi/Dhcp/password", self.general.wifi_dhcp.password)

            self.config.put(section + "/Sheduled/Reboot/enable", str(self.general.sheduled_reboot.enable))
            self.config.put(section + "/Sheduled/Reboot/time", self.general.sheduled_reboot.time)
            self.config.put(section + "/Sheduled/Reboot/timezone", self.general.sheduled_reboot.timezone)

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
                    self.config.put(key + "/meta", self.sonos_doorbell.saved_radios[i].meta.decode('utf-8'))
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
            f = open(self.config_filename, "rw")
            tree = etree.parse(f)
            f.close()

            for element in tree.xpath("//%s" % element_name):
                element.getparent().remove(element)

            fi = open(self.config_filename, "r+w")
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
            self.logger.warn("reset", exc_info=True)
        try:
            self.config = XMLSettings(self.config_filename)
        except:
            self.config = XMLSettings("")
            self.logger.warn("reset", exc_info=True)
        self.load()
        self.save()
