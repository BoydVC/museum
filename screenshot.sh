#!/usr/bin/env bash
# Headless Chrome (SwiftShader WebGL) screenshots of the offline snapshot. Usage: ./screenshot.sh [name query WxH]
set -euo pipefail
cd "$(dirname "$0")"
SNAP="file://$PWD/dist/museum-snapshot.html"
shot() { # out query size
  local prof; prof="$(mktemp -d /tmp/museumshot.XXXX)"
  nice -n 10 google-chrome --headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --hide-scrollbars \
    --force-device-scale-factor=1 --window-size="$3" --virtual-time-budget=9000 --user-data-dir="$prof" --screenshot="screenshots/$1" "$SNAP?$2" >/dev/null 2>&1 || true
  rm -rf "$prof"; echo "  screenshots/$1"
}
if [[ $# -ge 3 ]]; then shot "$1" "$2" "$3"; exit; fi
mkdir -p screenshots
shot 00-best-family-room.png       "room=Family%20%26%20Kids&yaw=38&x=2.6&dz=-2.5" 1440,900
shot 01-lobby.png                  "x=0&dz=0"                                 1440,900
shot 02-sports-room.png            "room=Sports&yaw=-28&x=-1.6"              1440,900
shot 03-fleet-room.png             "room=Fleet&yaw=40&x=2.6&dz=-2.5"   1440,900
shot 04-work-room.png              "room=Work&yaw=-28&x=-1.6"                1440,900
shot 05-space-room.png             "room=Space%20%26%20Fun&yaw=28&x=1.6"     1440,900
shot 06-placard-closeup.png        "p=chopsticks"                             1440,900
shot 07-fullscreen-painting.png    "open=bot-island-3d"                       1440,900
shot 08-lobby-fuel-gauge.png       "p=__none&room=Lobby&yaw=90&x=-1&dz=-8.8" 1440,900
shot 09-tour-mode.png              "tour=2&dwell=60"                          1440,900
shot 10-phone-room.png             "room=Sports&yaw=0"                        390,844
shot 11-phone-help.png             "room=Fleet&help=1"                        390,844
