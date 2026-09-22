import { test, expect } from "@playwright/test";

test("administrator completes registration, roster, attendance, report and logout workflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Set up your institution" }),
  ).toBeVisible();
  await page.getByLabel("Your name").fill("Browser Test Admin");
  await page.getByLabel("Username", { exact: true }).fill("browser-admin");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password-123");
  await page.getByRole("button", { name: "Create administrator" }).click();
  await expect(
    page.getByRole("heading", { name: "Attendance overview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Students", exact: true }).click();
  await page.getByRole("button", { name: "Add student" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Student ID").fill("UI001");
  await dialog
    .getByLabel("Full name", { exact: true })
    .fill("Browser Test Student");
  await dialog
    .getByLabel("Email", { exact: true })
    .fill("student@example.test");
  await dialog.getByLabel("Programme").fill("Computer Science");
  await dialog.getByRole("button", { name: "Save student" }).click();
  await expect(
    page.getByRole("cell", { name: "Browser Test Student" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Attendance overview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Students", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Browser Test Student" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(dialog.getByLabel("Student ID", { exact: true })).toBeEnabled();
  await dialog.getByLabel("Student ID", { exact: true }).fill("UI002");
  await dialog.getByLabel("SAP ID", { exact: true }).fill("00123456789");
  await dialog.getByRole("button", { name: "Save student" }).click();
  await expect(
    page.getByText("Student ID: UI002", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Consent", exact: true }).click();
  await dialog.getByLabel("Consent status").selectOption("RECORDED");
  await dialog
    .getByLabel("Record reference or reason")
    .fill("Test consent record for browser workflow");
  await dialog.getByRole("button", { name: "Save consent" }).click();
  await expect(
    page.getByRole("button", { name: "Enroll", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Attendance Sessions", exact: true })
    .click();
  await page.getByText("Add courses and sections", { exact: true }).click();
  await page.getByLabel("Code", { exact: true }).fill("UI101");
  await page.getByLabel("Name", { exact: true }).fill("Browser Test Course");
  await page.getByRole("button", { name: "Create course" }).click();
  await expect(
    page.getByRole("combobox", { name: "Course", exact: true }),
  ).toContainText("UI101");
  await page
    .getByRole("combobox", { name: "Course", exact: true })
    .selectOption({ label: "UI101 · Browser Test Course" });
  await page.getByLabel("Section name").fill("A");
  await page.getByLabel("Room", { exact: true }).fill("Lab");
  await page.getByRole("button", { name: "Create section" }).click();
  await page.getByRole("button", { name: "Edit roster" }).click();
  await dialog
    .getByRole("checkbox", { name: "Browser Test Student · UI002" })
    .check();
  await dialog.getByRole("button", { name: "Save roster (1)" }).click();
  await page
    .getByRole("button", { name: "Start session", exact: true })
    .click();
  await page.getByRole("button", { name: "View attendance" }).click();
  await dialog
    .getByRole("combobox", { name: "Student", exact: true })
    .selectOption("UI002");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("Verified in classroom by test operator");
  await dialog.getByRole("button", { name: "Save attendance" }).click();
  await expect(
    dialog.getByRole("cell", { name: "Present", exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Close session", exact: true })
    .click();
  await expect(dialog.getByText("CLOSED", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Browser Test Student" }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("attendance.csv");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByLabel("Institution", { exact: true })
    .fill("Browser Test Institution");
  await page.getByRole("button", { name: "Save configuration" }).click();
  await expect(page.getByRole("status")).toContainText("Configuration saved");
  await page.getByRole("button", { name: "Live Capture", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Live classroom capture" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review Queue", exact: true }).click();
  await expect(page.getByText("No pending review items.")).toBeVisible();
  await page.getByRole("button", { name: "Audit log", exact: true }).click();
  await expect(
    dialog.getByRole("cell", { name: "STUDENT_CREATED" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/sign-in.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("camera automatically analyzes in preview mode and shows face boxes on live video", async ({
  page,
}) => {
  // Use a generated video stream; never access the operator's real webcam in tests.
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const context = canvas.getContext("2d")!;
        const draw = () => {
          context.fillStyle = "#345678";
          context.fillRect(0, 0, 640, 480);
          context.fillStyle =
            Math.floor(performance.now() / 200) % 2 ? "#ffffff" : "#000000";
          context.fillRect(40, 40, 220, 400);
          requestAnimationFrame(draw);
        };
        draw();
        return canvas.captureStream(10);
      },
    });
  });
  const health = await (await page.request.get("/api/health")).json();
  const response = await page.request.post(
    health.setup_required ? "/api/setup" : "/api/auth/login",
    {
      headers: { "X-Requested-With": "AcademicVision" },
      data: health.setup_required
        ? {
            username: "browser-admin",
            password: "browser-test-password-123",
            name: "Browser Test Admin",
          }
        : { username: "browser-admin", password: "browser-test-password-123" },
    },
  );
  expect(response.ok()).toBeTruthy();
  let analysisRequests = 0;
  await page.route("**/api/vision/analyze", async (route) => {
    analysisRequests++;
    expect(route.request().postData()).not.toContain('name="session_id"');
    await route.fulfill({
      json: {
        width: 640,
        height: 480,
        mode: "preview",
        eligible_students: 1,
        detections: [
          {
            box: [120, 80, 100, 140],
            confidence: 0.99,
            state: "MATCHED",
            name: "Preview Student",
            sap_id: "00123456789",
            score: 0.9,
            reason: "Preview only",
            review_id: null,
          },
        ],
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Live Capture", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Capture mode" }),
  ).toHaveValue("");
  await expect(page.getByLabel("Analyze a classroom photo")).toBeEnabled();
  await page.getByRole("button", { name: "Start camera", exact: true }).click();
  await expect(page.getByTestId("live-face-box")).toBeVisible();
  await expect(page.getByTestId("live-face-box")).toHaveText(
    "Preview StudentSAP ID: 00123456789",
  );
  await expect(
    page.getByRole("checkbox", { name: "Analyze camera every 1.5 seconds" }),
  ).toBeChecked();
  expect(analysisRequests).toBeGreaterThan(0);
  await page.getByLabel("Enable motion monitoring").check();
  await page.getByLabel("Minimum sustained movement").selectOption("1");
  await expect(page.getByTestId("motion-status")).toContainText("% movement");
  await expect(
    page.getByRole("cell", { name: "Sustained high movement" }).first(),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Mark reviewed" }).first().click();
  await expect(
    page.getByRole("cell", { name: "Reviewed", exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  await expect(page.getByTestId("motion-status")).toHaveText(
    "Start the camera to monitor motion.",
  );
  await expect(page.getByTestId("live-face-box")).toHaveCount(0);
  const requestsAtStop = analysisRequests;
  await page.waitForTimeout(1700);
  expect(analysisRequests).toBe(requestsAtStop);
});
