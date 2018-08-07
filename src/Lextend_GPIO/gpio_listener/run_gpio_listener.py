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

import RPi.GPIO as GPIO
import os
import time
from time import sleep
import socket

from configuration import *
from utils import *

import logging.handlers
logger = logging.getLogger()
LOG_FILENAME = "/var/log/lextend.gpio.log"
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


class GpioListener(object):

    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)
        # Load configuration from XML file
        try:
            local_ip = get_local_ip()
        except:
            local_ip = ""

        self.cfg = ConfigManager(CONFIGURATION_SUBDIRECTORY, CONFIGURATION_FILENAME, lextend_ip=local_ip)

    def set_network(self):
        """ Set /etc/network/interfaces settings from loaded settings.
        """
        change_ip_address(self.cfg.general.lextend.ip)
        change_netmask(self.cfg.general.lextend.netmask)
        change_gateway(self.cfg.general.lextend.gateway)
        change_dns("%s %s" % (self.cfg.general.lextend.dns1, self.cfg.general.lextend.dns2))

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

        self.logger.info("setting network config")
        self.set_network()

        self.logger.info("rebooting in 2 seconds ...")
        time.sleep(2)
        self.logger.info("rebooting now")
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
                sock.sendto(bytes(packet, "utf-8"), ("0.0.0.0", UDP_PORT))
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
            self.logger.info("GPIO PIN%s => falling: %s, rising: %s" %
                             (gpios[i], self.cfg.gpio.udp_payload_falling[i], self.cfg.gpio.udp_payload_rising[i]))
            GPIO.setup(gpios[i], GPIO.IN, pull_up_down=GPIO.PUD_UP)
            GPIO.add_event_detect(gpios[i], GPIO.BOTH, callback=self.pin_cb_both, bouncetime=200)


if __name__ == "__main__":

    logger.info("Starting Rpi Manager.")

    GPIO.setwarnings(False)

    rpi = GpioListener()
    rpi.setup_gpios()

    GPIO.output(STATUS_LED_PIN, 1)
