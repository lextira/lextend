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
import netifaces as ni
import fileinput
import shutil
import re


def get_local_ip():
    """ Returns the first IP address.
    Returns:
        ip_address (str) : ip address if found, "" elsewhere.
    """
    interfaces = ni.interfaces()
    # ethernet_interface = ""
    ipv4_address = ""
    for interface in interfaces:
        if "eth0" in interface or "enp" in interface or "wlan0" in interface:
            ethernet_addresses = ni.ifaddresses(interface)
            if 2 in ethernet_addresses:
                ipv4_address = ethernet_addresses[2][0]["addr"]
                break

    return ipv4_address


def change_ethernet_static(new_ip_address, new_netmask, new_gateway, new_dns, new_dns2):
    src_file = "/etc/network/interfaces"
    # Create a backup, don't use .bak, overwritten by fileinput
    shutil.copyfile(src_file, src_file + ".backup")

    with open(src_file, 'w') as f:
        f.write("auto lo\n")
        f.write("iface lo inet loopback\n")
        f.write("allow-hotplug eth0\n")
        f.write("iface eth0 inet static\n")
        f.write("address %s\n" % new_ip_address)
        f.write("netmask %s\n" % new_netmask)
        f.write("gateway %s\n" % new_gateway)
        f.write("nameservers %s %s\n" % (new_dns, new_dns2))


def change_ethernet_dhcp():
    src_file = "/etc/network/interfaces"
    # Create a backup, don't use .bak, overwritten by fileinput
    shutil.copyfile(src_file, src_file + ".backup")

    with open(src_file, 'w') as f:
        f.write("auto lo\n")
        f.write("iface lo inet loopback\n")
        f.write("allow-hotplug eth0\n")
        f.write("iface eth0 inet dhcp\n")


def change_wifi_static(new_ip_address, new_netmask, new_gateway, new_dns, new_dns2):
    src_file = "/etc/network/interfaces"
    # Create a backup, don't use .bak, overwritten by fileinput
    shutil.copyfile(src_file, src_file + ".backup")

    with open(src_file, 'w') as f:
        f.write("auto lo\n")
        f.write("iface lo inet loopback\n")
        f.write("allow-hotplug wlan0\n")
        f.write("iface wlan0 inet static\n")
        f.write("address %s\n" % new_ip_address)
        f.write("netmask %s\n" % new_netmask)
        f.write("gateway %s\n" % new_gateway)
        f.write("nameservers %s %s\n" % (new_dns, new_dns2))
        f.write("wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf\n")


def change_wifi_dhcp():
    src_file = "/etc/network/interfaces"
    # Create a backup, don't use .bak, overwritten by fileinput
    shutil.copyfile(src_file, src_file + ".backup")

    with open(src_file, 'w') as f:
        f.write("auto lo\n")
        f.write("iface lo inet loopback\n")
        f.write("allow-hotplug wlan0\n")
        f.write("iface wlan0 inet dhcp\n")
        f.write("wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf\n")


def change_wpa_supplicant(ssid, psk):
    """
    Changes the fields in /etc/wpa_supplicant/wpa_supplicant.conf
    :param fieldname:
    :param parameter:
    :return:
    """
    src_file = "/etc/wpa_supplicant/wpa_supplicant.conf"
    # Create a backup, don't use .bak, overwritten by fileinput
    shutil.copyfile(src_file, src_file + ".backup")

    with open(src_file,"w") as f:
        f.write("ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev\n")
        f.write("update_config=1\n")
        f.write("country=GB\n\n")
        f.write("network={\n")
        f.write("\tssid=\"%s\"\n" % ssid)
        f.write("\tpsk=\"%s\"\n}" % psk)



