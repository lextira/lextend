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

#!/bin/bash
echo "Setting up folders"
#if [ -d /root/.config/lextend/smb/smb.conf ];
#then
#	mv /root/.config/lextend/smb/smb.conf /root/.config/lextend/smb/smb_back.conf
#fi
#sudo apt-get install samba
cp smb.conf /etc/samba/

mkdir -p /root/.config/lextend/sounds
if [ -d /root/.config/lextend/sounds/SGW_CustomSounds ];
then
	rm -rf /root/.config/lextend/sounds/SGW_CustomSounds
fi
if [ -d /root/.config/lextend/sounds/SGW_Commercials ];
then
        rm -rf /root/.config/lextend/sounds/SGW_Commercials
fi
if [ -d /root/.config/lextend/smb/SGW_Commercials ];
then
        rm -rf /root/.config/lextend/smb/SGW_Commercials
fi

if [ -d /root/.config/lextend/smb ];
then
        rm -rf /root/.config/lextend/smb
fi

mkdir -p /root/.config/lextend/sounds/defaults

mkdir -p /root/.config/lextend/sounds/smb/SGW_CustomSounds
mkdir -p /root/.config/lextend/sounds/smb/SGW_Commercials
chmod a+rx /root
chmod a+rx /root/.config
chmod a+rx /root/.config/lextend
chmod a+rx -R /root/.config/lextend/sounds

echo "Setting up samba shares."
groupadd LexAdms
useradd LexAdm
gpasswd -a LexAdm LexAdms
printf "pass\npass\n" | smbpasswd -a -s LexAdm

chgrp -R LexAdms /root/.config/lextend/sounds/defaults
chmod a+rx -R /root/.config/lextend/sounds/defaults
chmod g+w -R /root/.config/lextend/sounds/defaults

chgrp -R LexAdms /root/.config/lextend/sounds/smb
chmod a+rx -R /root/.config/lextend/sounds/smb
chmod g+w -R /root/.config/lextend/sounds/smb

if [ -f /root/.config/lextend/sounds/defaults/9-Store_Door_Chime.mp3 ];
then
	rm /root/.config/lextend/sounds/defaults/9-Store_Door_Chime.mp3
fi

# Restart samba server after updating config file
# TODO: rename to smbd samba
service smbd restart
while true
do
echo "Lextend" >/dev/null
done
