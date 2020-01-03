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
# import traceback

import time
import threading
import logging
import requests

# import urllib

from sonosdoorbell.SoCo import soco
from sonosdoorbell.SoCo.soco import config
# from SoCo.soco.plugins.spotify import Spotify
# from SoCo.soco.plugins.spotify import SpotifyTrack
from sonosdoorbell.SoCo.soco.data_structures import to_didl_string, DidlMusicTrack
from sonosdoorbell.SoCo.soco.music_services import MusicService
# from SoCo.soco.compat import quote_url
config.CACHE_ENABLED = False

FADE_OUT_ENABLED = False


class FuncThread(threading.Thread):
    """ Run a function in a thread.
    """
    def __init__(self, target, *args):
        self._des = target
        self.args = tuple(args)  # making it to tuple
        threading.Thread.__init__(self, )
        self._stopper = threading.Event()

    def run(self):
        self._des(*self.args)

    def stop(self):
        self._stopper.set()

    def stopped(self):
        return self._stopper.isSet()


class SonosPoolManager(object):
    """ Handles a pool of Sonos devices
    """
    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)

        self.devices_list = []

        self.last_alarm_uri = None
        self.last_alarm_regroup = True
        self.alarm_thread = None
        self.thread = None

    def play_track_or_radio(self, groups=None, splitter="", ruri="", rmeta="", command=None, volume=None):
        if groups is None:
            groups = []
        sonos_list = self.filter_zones(groups, splitter)
        for device in sonos_list:
            if device.device.is_coordinator:
                curr_uri = device.device.get_current_track_info()["uri"]
                if curr_uri:
                    device.device.play()
                    if command is 2:
                        self.volset(volume, groups, splitter)
                else:
                    device.device.play_uri(ruri, rmeta)
                    if command is 2:
                        self.volset(volume, groups, splitter)

    def discover(self):
        discovered = soco.discover()
        if discovered is not None:
            for sonos in list(discovered):
                self.logger.info("Discovered sonos : %s" % sonos.ip_address)
                try:
                    requests.get('http://%s:1400/status' % sonos.ip_address, timeout=1)
                    self.logger.info("Sonos Alive")

                    x = sonos.group.coordinator.ip_address  # sometimes a sonos is detected but group is None,
                    # and sonos is not in the controller list.

                    Update = True
                    for d in self.devices_list:
                        if d.ip == sonos.ip_address:
                            Update = False
                            break
                    if Update:
                        self.devices_list.append(SonosDeviceManager(sonos.ip_address))
                        self.logger.info("List of sonos : %s." % self.devices_list)
                except:
                    self.logger.info("Not responsive => Discarding.")
                    self.devices_list = [d for d in self.devices_list if d.ip != sonos.ip_address]

    def save_all_states(self):
        for d in self.devices_list:
            d.save_state()

    def pause_all_threaded(self, sonos_list, clear_q=True):
        threads = []
        for sonos in sonos_list:
            t = sonos.pause(clear_q)
            threads.append(t)
            t.start()
        # Wait for all to pause
        for t in threads:
            t.join()

    def group_ifneeded(self, sonos_list):
        regroup = True
        master = None

        # TODO: optimization:
        # 1. search for a coordinator that is in the sonos_list
        # 2. ungroup sonos in the group and not in the sonos_list
        # 3. group sonos not in the group but in sonos_list

        if sonos_list:
            if len(sonos_list[0].device.group.members) == len(sonos_list):
                if set(sonos_list[0].device.group.members) == set([d.device for d in sonos_list]):
                    regroup = False
                    master = next((d for d in sonos_list if d.device == sonos_list[0].device.group.coordinator), None)
                    self.logger.info("Skipping regroup. Already grouped correctly.")

            # TODO: optimization: group with the biggest group
            if regroup:
                # search for the coordinator with the biggest group
                try:
                    master = next((d for d in sonos_list if d.device == sonos_list[0].device.group.coordinator), None)
                    self.logger.info("group_ifneeded: master %s" % master.device.player_name)
                    for zone in sonos_list:
                        if zone.device.is_coordinator:
                            if len(zone.device.group.members) > len(master.device.group.members):
                                self.logger.info("group_ifneeded: zone %s" % zone.device.player_name)
                                master = zone
                    self.logger.info("group_ifneeded: final master %s" % master.device.player_name)
                except:
                    self.logger.error("An error occurred when searching for biggest group.", exc_info=True)

                # regroup
                for zone in sonos_list:
                    if zone.device not in master.device.group:
                        try:
                            self.logger.info("group_ifneeded: join %s" % zone.device.player_name)
                            zone.device.join(master.device)
                        except:
                            self.logger.error("An error occurred when regrouping.", exc_info=True)

        return regroup, master

    def set_volume(self, sonos_list, volume):
        for zone in sonos_list:
            try:
                zone.device.volume = volume
            except:
                self.logger.error("An error occurred when setting volume.")

    def regroup_ifneeded(self, sonos_list, regroup=True):
        master = None
        if regroup:
            # search in the state saved for the biggest group and do not unjoint it
            try:
                for device in sonos_list:
                    master = next((d for d in sonos_list if d.device == sonos_list[0].state.group.coordinator), None)
                    self.logger.info("regroup_ifneeded: master %s" % master.device.player_name)
                    for zone in sonos_list:
                        if zone.state.group.coordinator == zone.device:
                            if len(zone.state.group.members) > len(master.state.group.members):
                                self.logger.info("regroup_ifneeded: zone %s" % zone.device.player_name)
                                master = zone
                    self.logger.info("regroup_ifneeded: final master %s" % master.device.player_name)

                # exclude the biggest group from regrouping
                for device in master.state.group.members:
                    zone = next((d for d in sonos_list if d.device == device), None)
                    if zone:
                        self.logger.info("regroup_ifneeded: removing %s from sonos_list" % device.player_name)
                        try:
                            sonos_list.remove(zone)
                        except:
                            pass  # TODO: investigate why zone is not in the sonos_list sometimes

                self.logger.info("regroup_ifneeded: final sonos_list %s" % sonos_list)
            except:
                self.logger.error("An error occurred when searching for biggest group.", exc_info=True)
            # Unjoin all
            try:
                [zone.device.unjoin() for zone in sonos_list]
            except:
                self.logger.error("An error occurred when unjoining.")
            # Join previous groups
            for device in sonos_list:
                try:
                    zone = device.device
                    group_coordinator = device.state.group.coordinator
                    if zone is not group_coordinator:
                        zone.join(group_coordinator)
                except:
                    self.logger.error("An error occurred when joining previous group.")

            # time.sleep(4) # Without a delay here, coordinator infos, and play could fail.

    def resume_all_threaded(self, sonos_list, no_clear_q=False):
        threads = []
        for device in sonos_list:
            try:
                zone = device.device
                t = device.resume(no_clear_q)
                threads.append(t)
                t.start()
            except:
                self.logger.error("An error occurred when resuming coordinators.")
        # Wait for all to resume
        for t in threads:
            t.join()

    def pause_play_bell_resume_sync(self, thread, uri, volume, groups, splitter, suffix, ignore_sonos_names_enabled):
        """ Pause and save state, play uri at the specified volume and resume.
        Args:
            uri (str): uri of the sound to play. Generally the samba share link.
            volume (int): volume at which the sound will be played.
            groups (list): list of Lextender groups used by commercials
            splitter: for groups for commercials
            suffix: for bell
            ignore_sonos_names_enabled: quick setup mode
        """
        # Rediscover
        try:
            self.discover()
        except:
            self.logger.error("Could not start discovering Sonos.")
        lgroups = None
        try:
            lgroups = list(map(int, groups))
        except:
            pass
        sonos_list = []

        # DoorBell
        if suffix:
            for d in self.devices_list:
                try:
                    if suffix in d.device.player_name:
                        for sd in list(d.device.group.members):
                            for sdd in self.devices_list:
                                if sd.uid == sdd.device.uid:
                                    add = True
                                    for in_list in sonos_list:
                                        if in_list.device.uid == sdd.device.uid:
                                            add = False
                                            break

                                    if add:
                                        sonos_list.append(sdd)
                                    break
                except:
                    self.logger.error("An error occurred when creating sonos list.")

        # Alarm
        elif groups is []:
            self.logger.info("Alarm mode, playing on all sonos.")
            sonos_list = self.devices_list
        # Commercial with zones
        else:
            sonos_list = self.filter_zones(lgroups, splitter)

        self.logger.info("Playing on : %s", sonos_list)

        if ignore_sonos_names_enabled:
            self.logger.info("Quick setup enabled, playing on all sonos.")
            sonos_list = self.devices_list

        if len(sonos_list) == 0:
            self.logger.info("No sonos in the groups !")
            return

        # save state of all sonos
        self.logger.info("Saving all state.")
        self.save_all_states()
        restore_list = sonos_list[:]  # save a copy of the list for restore as it is changed by regrouping functions

        # pause all in parallel.
        self.pause_all_threaded(sonos_list)

        self.logger.info("Regrouping for bell.")

        # check if regrouping is needed
        regroup, master = self.group_ifneeded(sonos_list)

        # set bell volume everywhere
        if volume:
            self.set_volume(sonos_list, volume)

        # Bell
        master.play_bell(self.thread, uri, volume)

        # Resume
        self.regroup_ifneeded(sonos_list, regroup)

        # Resume all group coordinators
        # sonos_list.append(master) # add master to the list as it is not in.
        self.resume_all_threaded(restore_list)

    def pause_play_bell_resume(self, uri, volume=None, groups=None, splitter="", suffix="",
                               ignore_sonos_names_enabled=False):
        """ Call pause_play_bell_resume_sync in a separate thread to make it async.
        """
        if groups is None:
            groups = []
        self.thread = FuncThread(self.pause_play_bell_resume_sync, uri, volume, groups, splitter, suffix,
                                 ignore_sonos_names_enabled)
        return self.thread

    def alarm_start(self, uri, volume):
        self.alarm_thread = FuncThread(self.alarm_start_sync, uri, volume)
        return self.alarm_thread

    def alarm_start_sync(self, thread, uri, volume):
        # Rediscover
        try:
            self.discover()
        except:
            self.logger.error("Could not start discovering Sonos.")

        # Alarm
        self.logger.info("Alarm mode, playing on all sonos.")
        sonos_list = self.devices_list

        if len(sonos_list) == 0:
            self.logger.info("No sonos in the groups !")
            return

        # save state of all sonos
        self.save_all_states()

        # pause all in parallel.
        self.pause_all_threaded(sonos_list)

        self.logger.info("Regrouping for alarm.")

        # check if regrouping is needed
        self.last_alarm_regroup, master = self.group_ifneeded(sonos_list)

        # set bell volume everywhere
        self.set_volume(sonos_list, volume)

        # save alarm uri to do the double check when stopping
        self.last_alarm_uri = uri

        # play alarm in an infinite loop
        while not self.alarm_thread.stopped():
            master.play_bell(self.alarm_thread, uri, volume)

    def alarm_stop(self):
        sonos_list = self.devices_list

        # Resume
        self.regroup_ifneeded(sonos_list, self.last_alarm_regroup)

        # check to not play alarm again.
        if self.last_alarm_uri:
            for device in sonos_list:
                if device.state.uri == self.last_alarm_uri:
                    self.logger.info("Aborting resume after alarm stop.")
                    return

        # Resume all group coordinators
        self.resume_all_threaded(sonos_list)

    def filter_zones(self, groups, splitter):
        # Rediscover
        try:
            self.discover()
        except:
            self.logger.error("Could not start discovering Sonos.")

        sonos_list = self.devices_list

        if groups != []:
            sonos_list = []
            for d in self.devices_list:
                try:
                    spl = d.device.player_name.split(splitter)
                    if len(spl) > 1:
                        lextender_group = int(spl[-1][0])
                        if lextender_group != 0 and (lextender_group in groups):
                            for sd in list(d.device.group.members):
                                for sdd in self.devices_list:
                                    if sd.uid == sdd.device.uid:
                                        add = True
                                        for in_list in sonos_list:
                                            if in_list.device.uid == sdd.device.uid:
                                                add = False
                                                break

                                        if add:
                                            sonos_list.append(sdd)
                                        break
                except:
                    self.logger.error("An error occurred when creating sonos list.", exc_info=True)
        return sonos_list

    def play(self, groups=None, splitter=""):
        self.logger.info("playing")
        if groups is None:
            groups = []
        sonos_list = self.filter_zones(groups, splitter)

        # unjoin and regroup all as previous state is not known
        # removed see because grouping confuses users.
        # self.group_ifneeded(sonos_list)

        # Resume all group coordinators
        self.resume_all_threaded(sonos_list, True)

    def pause(self, groups=None, splitter=""):
        self.logger.info("pausing")
        if groups is None:
            groups = []
        # save state of all sonos
        self.save_all_states()

        sonos_list = self.filter_zones(groups, splitter)

        self.pause_all_threaded(sonos_list, False)

    def volup(self, groups=None, splitter="", percentage=1):
        if groups is None:
            groups = []
        sonos_list = self.filter_zones(groups, splitter)
        for device in sonos_list:
            try:
                vol = device.device.volume
                if vol + percentage < 100:
                    device.device.volume = vol + percentage
                else:
                    device.device.volume = 100
            except:
                self.logger.error("An error occurred when increasing volume.")

    def voldown(self, groups=None, splitter="", percentage=1):
        if groups is None:
            groups = []
        sonos_list = self.filter_zones(groups, splitter)
        for device in sonos_list:
            try:
                vol = device.device.volume
                if vol - percentage > 0:
                    device.device.volume = vol - percentage
                else:
                    device.device.volume = 0
            except:
                self.logger.error("An error occurred when decreasing volume.")

    def volset(self, volume=20, groups=None, splitter=""):
        if groups is None:
            groups = []
        sonos_list = self.filter_zones(groups, splitter)
        for device in sonos_list:
            try:
                device.device.volume = volume
            except:
                self.logger.error("An error occurred when setting the volume.")

    def get_tunein_info(self, device):
        media_info = device.avTransport.GetMediaInfo([('InstanceID', 0)])  # This uses SoCo to access the underlying
        # UPNP calls which gets AV data which is different to get_current_track_info()

        return media_info

    def play_uri(self, ruri, rmeta="", groups=None, splitter=""):
        if groups is None:
            groups = []
        sonos_list = self.filter_zones(groups, splitter)
        self.logger.info("Radio station %s, %s, %s." % (groups, splitter, [x.device.player_name for x in sonos_list]))
        for device in sonos_list:
            try:
                if device.device.is_coordinator:
                    # check if the uri is already being played and skip if it is the case.
                    curr_uri = None
                    try:
                        media_info = self.get_tunein_info(device.device)
                        curr_uri = media_info['CurrentURI']
                    except:
                        self.logger.error("An error occurred when trying to get current uri.", exc_info=True)
                    if curr_uri == ruri and "PLAYING" in device.device.get_current_transport_info()["current_transport_state"]:
                        self.logger.info("Already playing uri, Skipping play_uri.")
                    else:
                        device.device.play_uri(uri=ruri, meta=rmeta)

            except:
                self.logger.error("An error occurred when setting radio station.")

    def next(self, groups=None, splitter=""):
        if groups is None:
            groups = []
        sonos_list = self.filter_zones(groups, splitter)
        for device in sonos_list:
            try:
                device.device.next()
            except:
                self.logger.error("An error occurred when next.", exc_info=True)

    def previous(self, groups=None, splitter=""):
        if groups is None:
            groups = []
        sonos_list = self.filter_zones(groups, splitter)
        for device in sonos_list:
            try:
                device.device.previous()
            except:
                self.logger.error("An error occurred when previous.", exc_info=True)

    def nextRadio(self, groups=None, splitter=""):
        if groups is None:
            groups = []
        sonos_list = self.filter_zones(groups, splitter)
        for device in sonos_list:
            try:
                if device.is_coordinator:
                    zone = device.device
            except:
                self.logger.error("An error occurred when nextRadio.", exc_info=True)

    def previousRadio(self, groups=None, splitter=""):
        if groups is None:
            groups = []
        pass

    def annoucementStart(self, volume):
        """ Save, Regroup, lineIn for master (-LI) """
        # Rediscover
        try:
            self.discover()
        except:
            self.logger.error("Could not start discovering Sonos.")

        self.logger.info("Announcement start requested")
        sonos_list = self.devices_list

        if len(sonos_list) == 0:
            self.logger.info("No sonos in the groups !")
            return

        # search for master with "-LI" in the name
        annoucement_master = None
        for d in self.devices_list:
            if "-LI" in d.device.player_name:
                annoucement_master = d

        if annoucement_master is None:
            self.logger.info("No announcement master found !")
            return

        # save state of all sonos
        self.save_all_states()

        # pause all in parallel.
        self.pause_all_threaded(sonos_list)

        self.logger.info("Regrouping for announcement.")
        # regroup

        try:
            [zone.device.join(annoucement_master.device) for zone in sonos_list if zone is not annoucement_master]
        except:
            self.logger.error("An error occurred when regrouping.")
        # set announcement volume everywhere
        self.set_volume(sonos_list, volume)

        # Switch to line in for master
        annoucement_master.device.switch_to_line_in()
        annoucement_master.device.play()

    def annoucementStop(self):
        """ if one master only and linein is enabled, restore state"""
        self.logger.info("Announcement stop requested")
        sonos_list = self.devices_list

        if len(sonos_list) == 0:
            self.logger.info("No sonos in the groups !")
            return

        # search for master with "-LI" in the name
        annoucement_master = None
        for d in self.devices_list:
            if "-LI" in d.device.player_name:
                annoucement_master = d

        if annoucement_master is None:
            self.logger.info("No announcement master found !")
            return

        # Resume
        self.regroup_ifneeded(sonos_list, True)

        # Resume all group coordinators
        self.resume_all_threaded(sonos_list)


class SonosDeviceManager(object):
    """ Handles one sonos device.
      This a wrapper around SoCo class that handles pause/play dell/resume,
      for a sonos device saving and restoring all the state of the device.
    """
    class State(object):
        """ Helper class to store the state of the device.
        """
        def __init__(self):
            self.playlist_position = 0
            self.uri = ""
            self.metadata = ""
            self.tittle = ""
            self.media_uri = ""
            self.media_metadata = ""
            self.position = "00:00:00"
            # state is in ['STOPPED', 'PLAYING', 'PAUSED_PLAYBACK', 'TRANSITIONING']
            self.state = "STOPPED"
            self.from_queue = False
            self.queue = []
            self.volume = 0
            self.group = None
            self.play_mode = "NORMAL"

    def __init__(self, ip, logger=None):
        self.logger = logger or logging.getLogger(__name__)

        self.ip = ip
        self.device = soco.SoCo(self.ip)
        self.state = self.State()
        self.resume_thread = None
        self.pause_thread = None

    def discover(self):
        discovered = soco.discover()
        if discovered:
            return True
        else:
            return False

    def save_state(self):
        self.state = self.State()
        media_info = None
        track_info = None
        transport_info = None
        q = None

        try:
            media_info = self.device.avTransport.GetMediaInfo([('InstanceID', 0)])
        except:
            self.logger.error("Could not get current media info.")
        try:
            track_info = self.device.get_current_track_info()
        except:
            self.logger.error("Could not get current track info.", exc_info=True)
        try:
            transport_info = self.device.get_current_transport_info()
        except:
            self.logger.error("Could not get current transport info.", exc_info=True)
        try:
            q = self.device.get_queue()
            self.state.queue = []
            self.state.queue.append(q)
            self.logger.info("Saving queue : %s." % len(q))
        except:
            self.logger.error("Could not get queue info.", exc_info=True)

        try:
            self.state.playlist_position = track_info["playlist_position"]
        except:
            self.logger.error("Could not get playlist_position.", exc_info=True)

        try:
            self.state.uri = media_info['CurrentURI']
        except:
            self.logger.error("Could not get uri.", exc_info=True)

        # if playing from queue use track_info_uri else use media_info uri
        if self.state.uri.split(':')[0] == 'x-rincon-queue':
            try:
                self.state.uri = track_info["uri"]
            except:
                self.logger.error("Could not get uri.", exc_info=True)

        try:
            self.state.metadata = media_info['CurrentURIMetaData']
        except:
            self.logger.error("Could not get metadata.", exc_info=True)
        try:
            self.state.position = track_info["position"]
        except:
            self.logger.error("Could not get position.", exc_info=True)

        try:
            self.state.state = transport_info["current_transport_state"]
        except:
            self.logger.error("Could not get current transport state.", exc_info=True)

        try:
            self.state.volume = self.device.volume
            self.logger.info("Saving volume : %s." % self.state.volume)
        except:
            self.logger.error("Could not get volume.", exc_info=True)

        for QueueItem in q:
            try:
                if self.state.uri == QueueItem.resources[0].uri:
                    self.state.from_queue = True
                    break
            except:
                self.logger.error("Could not get queue element.", exc_info=True)

        try:
            self.state.play_mode = self.device.play_mode
        except:
            self.logger.error("Could not get current play_mode.", exc_info=True)

        try:
            self.state.group = self.device.group
        except:
            self.logger.error("Could not get current group.", exc_info=True)

    def pause_sync(self, clear_q=True):
        """ Save the current state, and pause if the device is playing.
        """

        # Rediscover if needed
        try:
            self.discover()
        except:
            self.logger.error("Could not start discovering Sonos.")

        self.save_state()
        # Fade out
        if FADE_OUT_ENABLED:
            self.logger.info("Fading out.")
            while self.device.volume != 0:
                self.device.volume = max(self.device.volume - 10, 0)
                time.sleep(0.100)
            self.logger.info("Fading out complete.")

        # clear queues for coordinators, otherwise we have an error.
        if self.device.is_coordinator:
            if clear_q:
                self.device.clear_queue()

            # Stop
            if self.state.state not in ["PAUSED_PLAYBACK", "STOPPED"]:
                try:
                    self.device.pause()
                except:
                    self.logger.error("Could not stop.", exc_info=True)

    def resume_sync(self, no_clear_q):
        """ Restore the previous state and resume playing if needed.
        """
        self.logger.info("Resuming %s" % self.device.player_name)
        # Prepare for fade in
        self.device.volume = 0

        #  restore queues
        if self.device.is_coordinator:
            self.logger.info("Restoring queue %s" % self.state.queue)

            # try to not clear and restore queue if possible
            reset_q = True
            if no_clear_q:
                reset_q = False
                if len(self.state.queue[0]) > 0:
                    q = self.device.get_queue()
                    if len(q) == len(self.state.queue[0]):
                        b = 0
                        for i in q:
                            if i.resources[0].uri != self.state.queue[0][b].resources[0].uri:
                                reset_q = True
                                break
                            b += 1
                    else:
                        reset_q = True
                else:
                    reset_q = True

            if reset_q:
                try:
                    self.device.clear_queue()
                    uris = []
                    for queue_group in self.state.queue:
                        for queue_item in queue_group:
                            if "x-sonos-spotify:" in queue_item.resources[0].uri:
                                # self.logger.info("adding Spotify item to queue %s" % queue_item)
                                spotify_uri = queue_item.resources[0].uri.replace("x-sonos-spotify:", "")
                                service = MusicService("Spotify")
                                didl = DidlMusicTrack(
                                    title="DUMMY",  # This is ignored. Sonos gets the title from the item_id
                                    parent_id="DUMMY",  # Ditto
                                    item_id="0fffffff{0}".format(spotify_uri),
                                    desc=service.desc
                                )
                                uris.append([service.sonos_uri_from_id(spotify_uri), to_didl_string(didl)])
                            else:
                                # self.logger.info("adding item to queue %s" % queue_item)
                                self.device.add_to_queue(queue_item)

                    if uris:
                        # Split in 16 URIs / request due to api limitation
                        uris_chuncks = [uris[x:x+16] for x in range(0, len(uris), 16)]

                        for chunk in uris_chuncks:

                            # Add it to the queue and play it
                            try:
                                response = self.device.avTransport.AddMultipleURIsToQueue([
                                    ("InstanceID", 0),
                                    ("UpdateID", 0),
                                    ("NumberOfURIs", len(chunk)),
                                    ("EnqueuedURIs", " ".join([elem[0] for elem in chunk])),
                                    ("EnqueuedURIsMetaData", " ".join([elem[1] for elem in chunk])),
                                    ("DesiredFirstTrackNumberEnqueued", 0),
                                    ("EnqueueAsNext", 1)
                                    ])
                            except:
                                self.logger.error("A problem occurred while adding item to queue", exc_info=True)
                except:
                    self.logger.error("A problem occurred while adding all items to queue", exc_info=True)

        # Resume playing if coordinator
        if self.device.is_coordinator:
            try:
                if self.state.from_queue:

                    # search for item again if in shuffle mode because after setting the queue items are shuffled again
                    if "SHUFFLE" in self.state.play_mode:

                        index = 0
                        q = self.device.get_queue()
                        for i in q:
                            index += 1
                            self.logger.info("%s  !! %s  !!  %s" % (i.resources[0].uri, self.state.uri, i.title))
                            if i.resources[0].uri == self.state.uri:
                                self.state.playlist_position = index
                                break

                    self.device.play_from_queue(int(self.state.playlist_position)-1)
                else:

                    self.device.play_uri(self.state.uri, self.state.metadata)

                self.device.play_mode = self.state.play_mode

            except:
                self.logger.error("A problem occurred while resuming", exc_info=True)
                if self.state.from_queue:
                    self.logger.error("q position : %s" % self.state.uri)
                else:
                    self.logger.error("uri : %s" % self.state.uri)

            try:
                # prevent seeking when position is not available
                # datetime.datetime.strptime(self.state.position, '%H:%M:%S')
                if "0:00:00" not in self.state.position:
                    self.device.seek(self.state.position)
            except:
                self.logger.error("position : %s" % self.state.position)

            if self.state.state == "PLAYING":
                pass
            elif self.state.state == "STOPPED":
                try:
                    self.device.stop()
                except:
                    self.logger.error("Could not restore STOPPED state.", exc_info=True)
            elif self.state.state == "PAUSED_PLAYBACK":
                try:
                    self.device.pause()
                except:
                    self.logger.error("Could not restore PAUSED_PLAYBACK state",
                                      exc_info=True)

        # Fade in, all
        self.logger.info("Restoring volume to %s. Fading in." % self.state.volume)
        while self.device.volume != self.state.volume:
            self.device.volume = min(self.device.volume + 5, self.state.volume)
            time.sleep(0.100)
        self.logger.info("Fade in complete.")

    def play_bell(self, thread, uri, volume=None):
        """ Play a sound from a given uri and volume.
            This function is blocking and will poll each second or so until
            the sound has finished playing.
        Args:
            uri (str): uri of the sound to play. Generally the samba share link.
            volume (int): volume at which the sound will be played.
        """
        try:
            self.logger.info("Bell : URI %s, Volume : %s." % (uri, volume))
            if volume:
                self.device.volume = volume
            self.device.play_uri(uri)
            self.device.play_mode = "NORMAL"  # important to not repeat
            time.sleep(1)  # sometimes it takes some time for the sonos to start.
            # Wait for completion : Polling each 1 second
            # Safety mechanism; maximum bell_playing_duration of 1 minute
            bell_playing_duration = 60
            while not thread.stopped():
                time.sleep(1)
                bell_playing_duration -= 1

                if bell_playing_duration == 0:
                    self.logger.error("Bell took more than 1minute to finish, forcing a stop.")
                    self.device.pause()
                    break

                try:
                    track_info = self.device.get_current_track_info()
                    transport_info = self.device.get_current_transport_info()
                except:
                    self.logger.error("Could not retrieve status while playing %s" % uri,
                                      exc_info=True)
                    break

                # Prevent a lock in case the device stopped playing.
                if uri not in track_info["uri"]:
                    self.logger.info("URI %s is not playing." % uri)
                    break
                if "PLAYING" not in transport_info["current_transport_state"]:
                    self.logger.info("URI %s is not playing." % uri)
                    break
        except:
            self.logger.error("An unexpected problem occurred while playing %s" % uri,
                              exc_info=True)

    def resume(self, no_clear_q):
        """ Call resume_sync in a separate thread to make it async.
        """
        self.resume_thread = FuncThread(self.resume_sync, no_clear_q)
        return self.resume_thread

    def pause(self, clear_q):
        """ Call pause_sync in a separate thread to make it async.
        """
        self.pause_thread = FuncThread(self.pause_sync, clear_q)
        return self.pause_thread