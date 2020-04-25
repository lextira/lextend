from base64 import b64encode
import json
import os

#from flask import Flask, request, redirect, render_template, flash, url_for
import requests

redirect_uri =  'https://developer.sonos.com/build/'
# Initalizing Flask App
# app = Flask(__name__)
# app.config.from_object(__name__)


# auth_code = '9c8d0d55-370a-42a3-86a3-053c15c42be8'
def refresh_token(auth_code):
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Authorization': 'Basic NmE4ZDgzMGQtYWQ3Yy00NDVkLTlhZjAtNmYzZmM5NjlkYTUxOmNiM2E5YTVlLWFhZGEtNDJmNC05ZWQwLTk5NWM1NjgxYTRlNw==',

    }
    data = {
        'grant_type': 'authorization_code',
        'code': auth_code,
        'redirect_uri': redirect_uri
    }

    response = requests.post('https://api.sonos.com/login/v3/oauth/access', headers=headers, data=data)
    # print(response.json())
    response_token = response.json()
    refresh_token = response_token['refresh_token']
    # print(refresh_token)
    return refresh_token
    # access_token(refresh_token)


def access_token(refresh_token):

    # print(refresh_token)
    headers1 = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Authorization': 'Basic NmE4ZDgzMGQtYWQ3Yy00NDVkLTlhZjAtNmYzZmM5NjlkYTUxOmNiM2E5YTVlLWFhZGEtNDJmNC05ZWQwLTk5NWM1NjgxYTRlNw==',
    }
    data1 = {
      'grant_type': 'refresh_token',
      'refresh_token': refresh_token
    }
    response1 = requests.post('https://api.sonos.com/login/v3/oauth/access', headers=headers1, data=data1)
    response_token = response1.json()
    # print(response_token)
    access_token = response_token['access_token']
    # print(access_token)
    return access_token




# if __name__ == '__main__':
#     app.run(debug=True)