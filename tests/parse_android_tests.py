import os
import xml.etree.ElementTree as ET

def main():
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_file:
        print("[INFO] GITHUB_STEP_SUMMARY not found. Skipping output.")
        return

    test_results_dir = "android/frontend/app/build/test-results/testDebugUnitTest"
    if not os.path.exists(test_results_dir):
        with open(summary_file, "a", encoding="utf-8") as f:
            f.write("\n## 🤖 Android Unit Test Results\n\nNo Android unit test results found.\n")
        return

    total = 0
    passed = 0
    failed = 0
    test_cases = []

    for file in os.listdir(test_results_dir):
        if file.endswith(".xml"):
            path = os.path.join(test_results_dir, file)
            try:
                tree = ET.parse(path)
                root = tree.getroot()
                
                suites = [root] if root.tag == "testsuite" else root.findall("testsuite")
                for suite in suites:
                    for tc in suite.findall("testcase"):
                        total += 1
                        name = tc.attrib.get("name")
                        classname = tc.attrib.get("classname", "").split(".")[-1]
                        duration = tc.attrib.get("time", "0.0")
                        
                        failure = tc.find("failure")
                        error = tc.find("error")
                        
                        if failure is not None or error is not None:
                            failed += 1
                            status = "❌ FAIL"
                        else:
                            passed += 1
                            status = "✅ PASS"
                            
                        test_cases.append((classname, name, status, f"{duration}s"))
            except Exception as e:
                print(f"Error parsing {file}: {e}")

    with open(summary_file, "a", encoding="utf-8") as f:
        f.write("\n## 🤖 Android Unit Test Results\n\n")
        rate = round(passed / total * 100, 1) if total else 0.0
        f.write(f"**Total:** {total} | **Pass:** {passed} | **Fail:** {failed} | **Pass Rate:** {rate}%\n\n")
        f.write("| Class | Test Case | Status | Duration |\n")
        f.write("|-------|-----------|--------|----------|\n")
        for tc in test_cases:
            f.write(f"| {tc[0]} | {tc[1]} | {tc[2]} | {tc[3]} |\n")
        f.write("\n")

if __name__ == "__main__":
    main()
