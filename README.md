#Lextend
Sonos Gateway with many interface options as RPi IOs, Flickr Bluetooth Button and a UDP API.

##Lextend has the following interfaces:
###On any Linux host
* UDP
###On RPi Hardware
* Flic Bluetooth Button
* Pysical GPIOs (with Extension Print 0-230V AC or DC)

By the use of the interfaces above you can trigger many Sonos actions with Lextend.
For example:

* Play, Stop, Pause
* Volume +/-
* Play one of 10 uploaded mp3 and resume previously played stream
* Play one of 10 uploaded mp3 and play infinitely till stoped

##Installation
###On RPi
* Install Docker
* Install Lextend_RPi.yml

##Usage
You can login to Lextend as follows:
* On any Linux host
* http://IP:8000
* On RPi Hardware
* http://IP

##Contributing
Fork it!
Create your feature branch: git checkout -b my-new-feature
Commit your changes: 
```
git commit -am 'Add some feature'
```
Push to the branch: 
```
git push origin my-new-feature
```
Submit a pull request :D

##License
The lextend package is made available under the terms of the GNU Public License v3
(or any higher version at your choice). See the file COPYING for the licensing terms for all modules.
