from base64 import b64encode
import json
import os
import requests

def discover(access):

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {}".format(access)
    }

    response = requests.get("https://api.ws.sonos.com/control/api/v1/households/", headers=headers)

    response_json = response.json()
    print(response_json)

    if len(response_json["households"]) == 0:
        print('No Device Found')
        return "No Device Found"
    else:
        household_id = response_json["households"][0]['id']
        # print(household_id)
        # response = requests.get("https://api.ws.sonos.com/control/api/v1/households/{}/groups".format(household_id),
        #                         headers=headers)

        # response_json = response.json()
        # print(response_json)
        # group_id = response_json["groups"][0]['id']
        # print(group_id)
        return household_id

def play(tocken,s, g):

   headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer {}".format(tocken)
   }

   response = requests.post(
      "https://api.ws.sonos.com/control/api/v1/households/{0}/groups/{1}/playback/play".format(s, g), headers=headers)

   print(response.json())

def pause(tocken,s, g):

   headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer {}".format(tocken)
   }

   response = requests.post(
      "https://api.ws.sonos.com/control/api/v1/households/{0}/groups/{1}/playback/pause".format(s, g), headers=headers)
   print(response.json())
def skipToNextTrack(tocken,s, g):

   headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer {}".format(tocken)
   }

   response = requests.post(
      "https://api.ws.sonos.com/control/api/v1/households/{0}/groups/{1}/playback/skipToNextTrack".format(s, g), headers=headers)
   print(response.json())

def skipToPreviousTrack(tocken,s, g):

   headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer {}".format(tocken)
   }

   response = requests.post(
      "https://api.ws.sonos.com/control/api/v1/households/{0}/groups/{1}/playback/skipToPreviousTrack".format(s, g), headers=headers)
   print(response.json())

def getVolume(tocken,s, g):

   headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer {}".format(tocken)
   }

   response = requests.get(
      "https://api.ws.sonos.com/control/api/v1/households/{0}/groups/{1}/groupVolume".format(s, g), headers=headers)
   res = response.json()
   print res
   Volume = res["volume"]
   # print Volume
   return Volume
def setVolume(tocken,s,g,vol):


    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {}".format(tocken)
    }
    data= '{"volume":'+vol+'}'

    response = requests.post(
        "https://api.ws.sonos.com/control/api/v1/households/{0}/groups/{1}/groupVolume".format(s, g), headers=headers,data=data)
    res = response.json()
    print response
    print res
    return response

def getHouseholds(tocken,s):

   headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer {}".format(tocken)
   }

   response = requests.get(
      "https://api.ws.sonos.com/control/api/v1/households/{}/groups".format(s), headers=headers)
   # res = response.json()
   # id = res["players"]
   # print id
   response_json = response.json()

   print response_json
   player = {}
   # print len(response_json)
   if "errorCode" not in response_json:
       for i in range(len(response_json['players'])):
           player_name = response_json['players'][i]['name']
           player_id = response_json['players'][i]['id']
           player[player_name] = player_id
   return player

def addGroup(tocken,household_id,group_id,playerIDstoAdd,playerIDstoRemove):
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {}".format(tocken)
    }
    data =""
    data = data + "{\"playerIdsToAdd\":["
    for i in range(len(playerIDstoAdd)):
        if i == len(playerIDstoAdd)-1:
            data = data + "\"" + (playerIDstoAdd[i])+ "\""
        else:
            data = data +"\"" + (playerIDstoAdd[i])+"\","

    data = data +"],\"playerIdsToRemove\":["
    for i in range(len(playerIDstoRemove)):
        # for i in range(len(playerIDstoRemove)):
        if i == len(playerIDstoRemove) - 1:
            data = data + "\"" + (playerIDstoRemove[i])+ "\""
        else:
            data = data + "\"" + (playerIDstoRemove[i]) + "\","

    data = data+"]}"
    print data
    # data = '{\"playerIdsToAdd\":[\"RINCON_949F3E01D5E601400\",\"RINCON_949F3E82A2AA01400\"]}'


    response = requests.post(
        "https://api.ws.sonos.com/control/api/v1/households/{0}/groups/{1}/groups/modifyGroupMembers".format(
            household_id, group_id), headers=headers,data=data)
    print response
def getPlaylist(tocken,s):

   headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer {}".format(tocken)
   }

   response = requests.get(
      "https://api.ws.sonos.com/control/api/v1/households/{0}/playlists".format(s), headers=headers)
   res = response.json()
   print res
   dict = {}
   for key in res["playlists"]:
       dict[key["name"]] = key["id"]
   print(dict)
   return dict

def loadPlaylist(tocken,s,g,playlistId):

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {}".format(tocken)
    }
    data= '{"playlistId" : '+playlistId+',"action" : "REPLACE","playOnCompletion" : true,"playModes" : {"shuffle" : true}}'

    response = requests.post(
        "https://api.ws.sonos.com/control/api/v1/households/{0}/groups/{1}/playlists".format(s, g), headers=headers,data=data)
    res = response.json()
    print response
    print res
    return response





