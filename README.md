# tackle

check links with tackle

    tackle www.google.com

will collect and test any a, script or link tags on google.com and make
sure they all issue a 200 response.

# advanced usage

This will check up to 200 a, script or link's on cnn.com

    tackle --limit 200 www.cnn.com

This will check up to 50 (default) script and link tags on cnn.com

    tackle --types script,link www.cnn.com

