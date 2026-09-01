import shutil

src = r"C:\Users\skp66\.gemini\antigravity-ide\brain\69020eec-c64b-4d50-b91f-aed7bdc11431\ai_neural_email_overview_1788254185073.jpg"
dst_pub = r"c:\Users\skp66\Videos\nova-email-marketer\frontend\public\landing\overview-dashboard.jpg"
dst_bld = r"c:\Users\skp66\Videos\nova-email-marketer\frontend\build\landing\overview-dashboard.jpg"

shutil.copyfile(src, dst_pub)
try:
    shutil.copyfile(src, dst_bld)
except:
    pass

print("SUCCESS: Overview image set to brand coral-orange AI Neural Core visual!")
