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
import pam


def pam_auth(username, password):
    """ Accepts username and password and tried to use PAM for authentication.
      Works only with root privileges
    """
    # return pam.authenticate(username, password, service="system-auth")
    try:
        return pam.authenticate(username, password, service="system-auth")
    except:
        return False
