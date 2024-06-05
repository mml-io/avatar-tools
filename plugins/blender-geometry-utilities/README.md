## Blender tools

In order to have your custom character in the metaverse, there is a process and an initial setup, \
the workflow for this will be using Blender, with a collection of addons and custom tools.

Blender 4.0 [https://download.blender.org/release](https://www.blender.org/download/releases/4-0/) \

These tools are available below, they are specific versions, you can check the links for different versions \
Game Rig Tools (select the version for Blender 4.0/4.1): https://toshicg.gumroad.com/l/game_rig_tools \
Surface Heat Skinning (the zip file contains 2 folders, use the latest one): http://www.mesh-online.net/shd-blender-addon.zip \
MML Blender add-on for the geometry utilities: [mml-avatar-tools.py](./mml-avatar-tools.py)

Tips:
It's better to install each Addon manually, in Blender you can install addons by pointing it to the zip files or python files, 
the Improbable Blender addon (python script above: blender-geometry-utils.py) will be a python file (.py) if there is an update you can re-download, 
replace it and it will be updated in Blender with the latest features, for the other addons (zip files), 
you'll need to download the updates, remove the old one from Blender and point it to the newest zip file.
Game Rig Tools is in active development and it has updates in a regular basis.

You can manually install each add-on, so you have control for each version, if you need to update it, etc,
if you are using the scripts folder (batch install) method you will have to unzip the add-ons.
If your asset already has a skeleton, you need to remove it, there is a quick button in the Improbable addon.

Combine the geometry in Blender, there is a button for that in the Improbable addon,
just keep in mind this will erase all other non geometry elements in your scene and it will unify all the geometry as one,
it will also remove parent transform groups.

Documentation: https://docs.msquared.io/tutorials-and-features/avatars/creating-mml-avatars-with-blender-and-free-rigging-tools \
Video tutorial: https://www.youtube.com/watch?v=0m5xAzhoGkQ
