# libre-client

This app will use a LibreLinkUp user's credentials (the "caregiver/administrator") to retrieve the Libre CGM values for all users ("patients") sharing their data with the caregiver/administrator.

The first 4 user's CGM data are mapped to 4 separate Nightscout websites.

https://ns-11.oracle.cgmsim.com <br>
https://ns-12.oracle.cgmsim.com <br>
https://ns-13.oracle.cgmsim.com <br>
https://ns-14.oracle.cgmsim.com <br>

The script runs every 5 minutes and updates the Nightscout websites.

A static web page is served displaying all 4 Nightscouts or one at a time, in a "centralized monitoring" style.

This is work in progress.
