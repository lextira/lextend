# Lextend
Sonos Gateway with many interface options as RPi IOs, Flickr Bluetooth Button and a UDP API.

## Lextend has the following interfaces:
### On any Linux host
* UDP
### On RPi Hardware
* Flic Bluetooth Button
* Pysical GPIOs (with Extension Print 0-230V AC or DC)

By the use of the interfaces above you can trigger many Sonos actions with Lextend.
For example:

* Play, Stop, Pause
* Volume +/-
* Play one of 10 uploaded mp3 and resume previously played stream
* Play one of 10 uploaded mp3 and play infinitely till stoped

## Installation OS and Docker on RPi 3
### Install Raspbian Lite
* https://www.raspberrypi.org/documentation/installation/installing-images/
### Update Packages
Update Raspberry Pi packages using the following command
*  `sudo apt-get update && sudo apt-get upgrade`
### Install Docker
Install Docker using following command
*  `curl -sSL https://get.docker.com | sh`
### Add permission to Pi User to run Docker Commands
Add “pi” user to “docker” group using the following command. You must Log off from Raspberry Pi and Login again, for this to take effect.
*  `sudo usermod -aG docker pi`
### Verify Installation
Check Docker installation using the “docker –version” command. If you see the correct version, you are good to go.
*  `docker –version`
### Run Hello-World Program
Run the ARM-based “hello-word” Docker container using 
* `docker run armhf/hello-world`
### Docker Compose
On RASPBIAN, you can download the Docker Compose binary from the Compose repository release page on GitHub. Compose is a tool for defining and running multi-container Docker applications. With Compose, you use a YAML file to configure your application’s services. Then, with a single command, you create and start all the services from your configuration.
* `sudo apt-get -y install python-pip`
* `sudo pip install docker-compose`
### Test the installation
Check Docker installation using the “docker-compose  - -version” command. If you see the correct  version, you are good to go.
* `docker-compose --version`

## Install Lextend
### Install git
*  `sudo apt-get install git`
### Clone Lextend from GitHub
*  `git clone https://github.com/lextira/lextend.git`
### Start Lextend
Go to lextend/src directory and up docker compose
*  `cd lextend/src`
*  `docker-compose up -d`
### Stop Lextend
Bring everything down, removing the containers entirely
*  `docker-compose down`

## Usage
You can login to Lextend as follows:
* On any Linux host
* http://IP:8000
* On RPi Hardware
* http://IP

## Contributing
If you are just starting with GitHub, you can follow this guide:
* https://codeburst.io/a-step-by-step-guide-to-making-your-first-github-contribution-5302260a2940

## License
The lextend package is made available under the terms of the GNU Public License v3
(or any higher version at your choice). See the file COPYING for the licensing terms for all modules.
