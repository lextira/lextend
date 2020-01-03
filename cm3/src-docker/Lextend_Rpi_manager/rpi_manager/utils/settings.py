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
# common config

CONFIGURATION_SUBDIRECTORY = "lextend"
CONFIGURATION_FILENAME     = "config.xml"
SGW_CUSTOMSOUNDS           = "/root/.config/lextend/sounds/smb/SGW_CustomSounds"
SGW_COMMERCIALS            = "/root/.config/lextend/sounds/smb/SGW_Commercials"

# web frontend

SERVER_ADDRESS             = "0.0.0.0"
SERVER_PORT                = 80

DEBUG_ENABLE_EMPTY_AUTH    = False
FLASK_MAX_UPLOAD_SIZE      = 16 * 1024 * 1024
FLASK_DEBUG                = False
FLASK_USE_RELOADER         = False

# sonos config
UDP_PORT                   = 5050

RPC_IP                     = "0.0.0.0"
RPC_PORT_1                  = 2882
RPC_PORT_2                  = 2883

# version
SOFTWARE_VERSION           ="v4.9-8.1"


