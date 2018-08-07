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
        # if "wlan0" in interface:
        #     ethernet_addresses = ni.ifaddresses(interface)
        #     if 2 in ethernet_addresses:
        #         ipv4_address = ethernet_addresses[2][0]["addr"]
        #         break

        if "eth0" in interface or "enp" in interface:
            ethernet_addresses = ni.ifaddresses(interface)
            if 2 in ethernet_addresses:
                ipv4_address = ethernet_addresses[2][0]["addr"]
                break

    return ipv4_address


def change_network_field(fieldname, parameter):
    src_file = "/etc/network/interfaces"
    # Create a backup, don't use .bak, overwritten by fileinput
    shutil.copyfile(src_file, src_file + ".backup")
    eth_found = False
    f = fileinput.input(src_file, inplace=True)
    for line in f:
        if "eth" in line:
            eth_found = True
        if eth_found:
            if re.search(r'\b%s\b' % fieldname, line):
                position = line.find(fieldname)
                line = line[:position] + "%s %s" % (fieldname, str(parameter))
                print(line.rstrip())
                continue
            # skip "network" and "broadcast"
            if re.search(r'\b%s\b' % "network", line):
                continue
            if re.search(r'\b%s\b' % "broadcast", line):
                continue

        print(line.rstrip())
    f.close()


def change_ip_address(new_ip_address):
    """ Changes the ip address in /etc/network/interfaces file.
    A backup file is created before .
    """
    change_network_field("address", new_ip_address)


def change_netmask(new_netmask):
    """ Changes the netmask in /etc/network/interfaces file.
    A backup file is created before .
    """
    change_network_field("netmask", new_netmask)


def change_gateway(new_gateway):
    """ Changes the gateway in /etc/network/interfaces file.
    A backup file is created before .
    """
    change_network_field("gateway", new_gateway)


def change_dns(new_dns):
    """ Changes the dsn in /etc/network/interfaces file.
    A backup file is created before .
    """
    change_network_field("dns-nameservers", new_dns)


def change_wlan(winame):
    src_file = "/etc/network/interfaces"
    shutil.copyfile(src_file, src_file + "_back")
    no_wlan = False
    with open(src_file, "r") as read_file:
        content = read_file.readlines()
        for line in content:
            if winame not in line:
                no_wlan = True
            else:
                no_wlan = False
    if no_wlan:
        content.append("auto %s\niface %s inet dhcp\n" % (winame, winame))
        with open(src_file, "w") as write_file:
            for line in content:
                write_file.write(line)


def change_wpa_supplicant(fieldname, parameter):
    """
    Changes the fields in /etc/wpa_supplicant/wpa_supplicant.conf
    :param fieldname:
    :param parameter:
    :return:
    """
    src_file = "/etc/wpa_supplicant/wpa_supplicant.conf"
    # Create a backup, don't use .bak, overwritten by fileinput
    shutil.copyfile(src_file, src_file + ".backup")
    network_found = False
    with open(src_file) as f1:
        lines = f1.readlines()
        for line in lines:
            if "network" in line:
                network_found = True

    if not network_found:
        lines = ["network={", "\n", "ssid=\"\"", "\n", "psk=\"\"", "\n", "}"]
        with open(src_file, "w") as g:
            for line in lines:
                g.write(line)

    f = fileinput.input(src_file, inplace=True)
    for line in f:
        if re.search(r'\b%s\b' % fieldname, line):
            position = line.find(fieldname)
            line = line[:position] + "%s=\"%s\"" % (fieldname, str(parameter))
            print(line.rstrip())
            continue
        print(line.rstrip())
    f.close()


def change_ssid(new_ssid):
    """ Changes the ssid in /etc/wpa_supplicant/wpa_supplicant.conf file.
    A backup file is created before .
    """
    change_wpa_supplicant("ssid", new_ssid)


def change_psk(new_psk):
    """ Changes the psk in /etc/wpa_supplicant/wpa_supplicant.conf file.
    A backup file is created before .
    """
    change_wpa_supplicant("psk", new_psk)
