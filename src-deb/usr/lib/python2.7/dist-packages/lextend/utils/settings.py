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
RPC_PORT                   = 2882

# ota config
OTA_SERVER                 = "ftp.lextend.ch"
OTA_SERVER_LOGIN           = "lextendupdate@lextend.ch"
OTA_SERVER_PASSWORD        = "4ertQ223aEE87"

# gpios
CONFIG_RESET_BUTTON_PIN    = 31
STATUS_LED_PIN             = 3

CONFIG_RESET_HOLD_TIME_SEC = 5

# version
SOFTWARE_VERSION           = "v4.9-3"


