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

FROM arm32v7/python:3.4-jessie

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
copy  /flic_listener /app

# Install any needed packages specified in requirements.txt
RUN  pip3 install -r postinst

# Run run_lextend_webfrontend.py when the container launches
CMD ["python3","flic_manager.py"]


