# NEXCHAT

Realtime chat + WebRTC voice/video calls. Static site (GitHub Pages) + Firebase Auth + Firestore (Spark plan).

## 1. Firebase
1. Console > Project settings > Your apps > Web app: copy the config into `js/firebase-config.js`.
2. Authentication > Sign-in method: enable **Email/Password**.
3. Firestore Database: create (production mode). Rules tab: paste `firestore.rules`, **Publish**.
4. Authentication > Settings > Authorized domains: add `YOURNAME.github.io`.

## 2. GitHub Pages
Create a repo, upload ALL files keeping the `css/` and `js/` folders, then Settings > Pages > Deploy from branch `main` / root. Open `https://YOURNAME.github.io/REPO/`. (Calls need HTTPS, which Pages provides.)

## 3. TURN (needed for calls on many mobile networks)
STUN alone fails behind symmetric NAT / carrier NAT. Get TURN credentials from a provider (Metered, Twilio, own coturn) and put them in `ICE_SERVERS` in `js/firebase-config.js`. They are visible to every visitor, so use limited credentials. No TURN credentials are included, none were invented.

## 4. Two-user test
Create account A on phone 1 and B on phone 2 (different networks). Note each NEXCHAT number in Profile. A adds B by number (and the reverse). Chat both ways, swipe a message right to reply, long-press for Copy / Delete. Then call each way, test mute, camera, switch camera, decline, cancel, and no answer (45 s = missed).

## Status
Verified: JavaScript syntax only. NOT verified: Firebase connection, rules in the emulator, calls between real devices. Run the test above.

Not implemented: groups, status, media/voice notes, block, pin, reactions, typing indicator, profile photos, pagination beyond the latest 80 messages. Missed calls show as a toast, not in chat history. The password is never stored or displayable.
Known limits: any chat member can edit the `hiddenFor` list (affects only message visibility); ended call documents stay (small) since clients cannot delete them.
