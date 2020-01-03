from base64 import b64encode
import json
import os
import requests

redirect_uri =  'https://developer.sonos.com/build/'


auth_code = 'b35c7555-4871-450a-9d2d-3c99f218d98f'

def refresh_token():
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Authorization': 'Basic ZTRjMjM0ODItYzNmYS00NjIxLTg1Y2MtYjEyNDA5YWE1YzFlOjUwNjBhOTFkLTUwNmMtNGVkYS1hNGQzLWEzM2MxOTQyYjNiNA==',

    }
    data = {
        'grant_type': 'authorization_code',
        'code': auth_code,
        'redirect_uri': redirect_uri
    }

    response = requests.post('https://api.sonos.com/login/v3/oauth/access', headers=headers, data=data)
    print(response.json())
    response_token = response.json()
    refresh_token = response_token['refresh_token']
    access_token(refresh_token)


def access_token(refresh_token):

    print(refresh_token)
    headers1 = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Authorization': 'Basic ZTRjMjM0ODItYzNmYS00NjIxLTg1Y2MtYjEyNDA5YWE1YzFlOjUwNjBhOTFkLTUwNmMtNGVkYS1hNGQzLWEzM2MxOTQyYjNiNA==',
    }
    data1 = {
      'grant_type': 'refresh_token',
      'refresh_token': refresh_token
    }
    response1 = requests.post('https://api.sonos.com/login/v3/oauth/access', headers=headers1, data=data1)
    response_token = response1.json()
    print(response_token)
    access_token = response_token['access_token']
    discover(access_token)

def discover(access_token):
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {}".format(access_token)
    }

    response = requests.get("https://api.ws.sonos.com/control/api/v1/households/", headers=headers)
    print(response)
    response_json = response.json()
    # print(response_json)
    household_id = response_json["households"][0]['id']
    print(household_id)
    response = requests.get("https://api.ws.sonos.com/control/api/v1/households/{}/groups".format(household_id),
                            headers=headers)
    response_json = response.json()
    # print(response_json)
    group_id = response_json["groups"][0]['id']
    print(group_id.encode("utf-8"))

    

refresh_token()


