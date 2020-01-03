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
import random
from glob import glob
import shutil

# from settings import *

import logging


class SoundsManager(object):
    """ This class handles the sounds that are used as a bell sound.

      Sound files are stored in two folders as follows:
        defaults : /root/.config/[CONFIG_SUBDIR]/sounds/defaults/
        uploads : /root/.config/[CONFIG_SUBDIR]/smb/SGW_CustomSounds

      defaults contain 10 preinstalled sounds that must be there.
      uploads holds user uploaded sounds, they are 10 at most.

      User running this script should have read permission for defaults,
      and read/write permission for uploads.

      Sounds' filenames always start with "index-", in the form index-name.ext
    """
    def __init__(self, config_subdir, logger=None):
        self.logger = logger or logging.getLogger(__name__)

        self.sounds_folder = os.path.join("/root", ".config", config_subdir,
                                          "sounds")
        self.sounds_defaults_folder = os.path.join(self.sounds_folder, "defaults")
        self.sounds_uploads_folder = os.path.join("/root", ".config", config_subdir,
                                                  "sounds", "smb", "SGW_CustomSounds")

        self.commercials_uploads_folder = os.path.join("/root", ".config", config_subdir,
                                                       "sounds", "smb", "SGW_Commercials")

        # Create needed folders if they do not exist.
        folders = [self.sounds_folder,
                   self.sounds_defaults_folder,
                   self.sounds_uploads_folder,
                   self.commercials_uploads_folder]
        for folder in folders:
            try:
                if not os.path.exists(folder):
                    os.makedirs(folder)
            except:
                self.logger.error("Could not guarantee that %s exists." % folder,
                                  exc_info=True)

        try:
            # Copy default sounds to default folder
            package_folder = os.path.dirname(__file__)

            sounds_defaults = os.path.join(package_folder, "..", "sounds", "defaults")
            for filename in glob(os.path.join(sounds_defaults, '*-*')):
                shutil.copy(filename, self.sounds_defaults_folder)
        except:
            self.logger.error("Could not copy default sounds to user config folder.",
                              exc_info=True)

    def delete_file_by_index(self, index):
        """ Delete an uploaded sound from its index.
        Args:
          index (int): index of the uploaded sound to delete.
        """
        target = os.path.join(self.sounds_uploads_folder, str(index)) + "-*"
        for file_to_delete in glob(target):
            try:
                os.remove(file_to_delete)
            except:
                self.logger.error("While deleting %s." % file_to_delete, exc_info=True)

    def create_upload_path(self, index, filename):
        """ Return the full path of an uploading sound from it's name and index.
        Args:
          index (int): index of the uploaded sound.
          filename (str): filename of the uploaded sound.
          Returns:
          full_path (str) : full path of the upload sound.
        """
        full_filename = "%s-%s" % (str(index), filename)
        return os.path.join(self.sounds_uploads_folder, full_filename)

    def delete_commercial_by_index(self, index):
        """ Delete an uploaded sound from its index.
        Args:
          index (int): index of the uploaded sound to delete.
        """
        target = os.path.join(self.commercials_uploads_folder, str(index)) + "-*"
        for file_to_delete in glob(target):
            try:
                os.remove(file_to_delete)
            except:
                self.logger.error("While deleting %s." % file_to_delete, exc_info=True)

    def create_commercial_upload_path(self, index, filename):
        """ Return the full path of an uploading sound from it's name and index.
        Args:
          index (int): index of the uploaded sound.
          filename (str): filename of the uploaded sound.
        Returns:
          full_path (str) : full path of the upload sound.
        """
        full_filename = "%s-%s" % (str(index), filename)
        return os.path.join(self.commercials_uploads_folder, full_filename)

    def get_random_commercial_path(self):
        """ Return the full path of a random commercial.
        Returns:
          full_path (str) : full path of the upload sound.
        """
        try:
            filename = random.choice([x for x in os.listdir(self.commercials_uploads_folder)])
            return os.path.join(self.commercials_uploads_folder, filename)
        except:
            return ""

    def search_path_by_index(self, index, default_sound=False):
        """ Return the full path of a sound by index, uploads are searched first.
        Args:
          index (int): index of the sound.
        Returns:
          full_path (str) : full path of the sound. None if nothing is found.
        """
        if not default_sound:
            uploads = glob(os.path.join(self.sounds_uploads_folder, str(index)) + "-*")
            if uploads:
                return uploads[0]

        defaults = glob(os.path.join(self.sounds_defaults_folder, str(index)) + "-*")
        if defaults:
            return defaults[0]

        return None
