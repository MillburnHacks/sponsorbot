# Sponsorbot

**WARNING:** do not use sponsorbot yet. It does not keep track of which businesses have been
contacted, so it's possible that a business can be emailed multiple times, which would annoy them.

Sometimes, it's hard to find sponsors for a hackathon. This bot scans through online sources to
find companies and their contact info, and then emails them about sponsoring a hackathon.

Before using Sponsorbot, you have to run a quick setup by running `npm run init`

To email restaurants in NYC, run:

```bash
node . --query "restaurant" --latitude=40.7128 --longitude=-74.0059
```

It will ask for your Gmail password so that it can send some emails. It doesn't save your password
or show it, so it's safe.
