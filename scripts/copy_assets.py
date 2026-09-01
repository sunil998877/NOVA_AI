import shutil
import os

src1 = r"C:\Users\skp66\.gemini\antigravity-ide\brain\69020eec-c64b-4d50-b91f-aed7bdc11431\overview_dashboard_ui_1788253603103.jpg"
dst1 = r"c:\Users\skp66\Videos\nova-email-marketer\frontend\public\landing\overview-dashboard.jpg"

src2 = r"C:\Users\skp66\.gemini\antigravity-ide\brain\69020eec-c64b-4d50-b91f-aed7bdc11431\how_it_works_workflow_ui_1788253629258.jpg"
dst2 = r"c:\Users\skp66\Videos\nova-email-marketer\frontend\public\landing\how-it-works-workflow.jpg"

shutil.copyfile(src1, dst1)
shutil.copyfile(src2, dst2)
print("SUCCESS: Assets copied to public/landing/")
