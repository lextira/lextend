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
