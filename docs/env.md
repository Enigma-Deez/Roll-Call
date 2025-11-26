# os.getenv("SERVER_CAMERA_INDEX", 0)
→ Looks for an environment variable named SERVER_CAMERA_INDEX.
→ If it’s not set, it defaults to 0.

int(...)
→ Converts the value to an integer, because camera indices must be numbers.

Purpose:
Tells OpenCV which camera to use (usually 0 is the default laptop webcam).



# os.getenv("FACE_MATCH_TOLERANCE", 0.5)
→ Looks for an environment variable named FACE_MATCH_TOLERANCE.
→ Defaults to 0.5 if not set.

float(...)
→ Converts the value to a decimal number, because face distances are floats.

Purpose:
Sets how strict the face recognition matching is:

Lower number → stricter (less likely to match wrong face)

Higher number → looser (more likely to match, might allow mistakes)