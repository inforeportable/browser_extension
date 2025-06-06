document.addEventListener('DOMContentLoaded', function () {
    const hospital_group = ["08322",
        "08323",
        "08324",
        "08325",
        "08326",
        "08327",
        "08328",
        "08329",
        "08330",
        "08331",
        "08332",
        "08333",
        "08334",
        "08335",
        "08336",
        "08337",
        "08338",
        "08339",
        "08340",
        "08341",
        "08342",
        "08343",
        "08344",
        "08345",
        "08346",
        "08347",
        "08348",
        "08349",
        "08350",
        "08351",
        "08357",
        "08358",
        "08405",
        "08440",
        "08441",
        "10679",
        "14870",
        "23916",
        "77508",
        "77645",
        "12458",
        "14331",
        "25055",
        "22750",
        "40755",
        "40751"]; // ตัวแปรสำหรับตรวจสอบ org.code ในอนาคต

    const email_group = []; // ตัวแปรสำหรับตรวจสอบ email ในอนาคต
    const checkButton = document.getElementById('checkButton');
    const copyButton = document.getElementById('copyButton'); // เตรียมไว้สำหรับ Event ถัดไป

    function updateTableCell(id, value) {
        const cell = document.getElementById(id);
        if (cell) {
            cell.textContent = value !== undefined && value !== null ? value : '-';
        }
    }

    function updateOrAddCopyRow(valueToDisplay) {
        const tbody = document.querySelector('#user-info tbody');
        if (!tbody) return;

        let copyRow = document.getElementById('row-copy-data');

        if (!copyRow) {
            copyRow = tbody.insertRow(-1); // เพิ่มแถวต่อท้ายสุด
            copyRow.id = 'row-copy-data';
            const cell1 = copyRow.insertCell(0);
            const cell2 = copyRow.insertCell(1);
            cell1.textContent = "Copy";
            cell2.id = "val-copy-data"; // ให้ ID กับ cell ที่แสดงค่า
        }
        const valueCell = document.getElementById('val-copy-data') || copyRow.cells[1];
        valueCell.textContent = valueToDisplay;
        valueCell.style.wordBreak = 'break-all'; // ช่วยให้ข้อความยาวๆ ตัดคำได้
    }

    function clearUserInfoAndCopyRow() {
        // Clear user info fields
        updateTableCell('val-loginId', '-');
        updateTableCell('val-pid', '-');
        updateTableCell('val-email', '-');
        updateTableCell('val-fname', '-');
        updateTableCell('val-lname', '-');
        updateTableCell('val-org-code', '-');
        updateTableCell('val-org-name', '-');
        updateTableCell('val-status', '-'); // Clear status as well

        // Remove the copy row if it exists
        const existingCopyRow = document.getElementById('row-copy-data');
        if (existingCopyRow) {
            existingCopyRow.remove();
        }
        // Disable copy button initially
        copyButton.disabled = true;
        // Reset copy button text and icon
        copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span> Copy';


    }

    checkButton.addEventListener('click', async () => {
        clearUserInfoAndCopyRow();
        updateTableCell('val-status', 'Loading...');

        try {
            const cookies = await chrome.cookies.getAll({ domain: "authenservice.nhso.go.th" });

            let combinedCookieString = "";
            if (cookies && cookies.length > 0) {
                combinedCookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}; `).join('');
            } else {
                updateTableCell('val-status', 'No cookies found'); // แสดงสถานะว่าไม่พบคุกกี้
                updateTableCell('val-org-name', 'ไม่พบ');
                updateOrAddCopyRow("ไม่พบ");
                return;
            }

            const response = await fetch('https://authenservice.nhso.go.th/authencode/api/user-info', {
                method: 'GET',
                headers: {
                    'Cookie': combinedCookieString
                }
            });

            updateTableCell('val-status', response.status);

            if (response.ok) {
                // Response is OK (status 2xx)
                const data = await response.json();
                const orgCodeFromAPI = data.org ? data.org.code : null;

                if (orgCodeFromAPI && hospital_group.includes(orgCodeFromAPI)) {
                    // response.ok = True AND org.code is in hospital_group
                    updateTableCell('val-loginId', data.loginId);
                    updateTableCell('val-pid', data.pid);
                    updateTableCell('val-email', data.email);
                    updateTableCell('val-fname', data.fname);
                    updateTableCell('val-lname', data.lname);
                    updateTableCell('val-org-code', data.org.code); // orgCodeFromAPI is valid here
                    updateTableCell('val-org-name', data.org.name); // orgCodeFromAPI is valid here
                    updateOrAddCopyRow(btoa(combinedCookieString));
                    copyButton.disabled = false; // Enable the Copy button
                } else {
                    // response.ok = True AND org.code is NOT in hospital_group (or org is missing)
                    const notFoundMessage = "ไม่พบหน่วยบริการที่กำหนด";
                    updateTableCell('val-loginId', notFoundMessage);
                    updateTableCell('val-pid', notFoundMessage);
                    updateTableCell('val-email', notFoundMessage);
                    updateTableCell('val-fname', notFoundMessage);
                    updateTableCell('val-lname', notFoundMessage);
                    updateTableCell('val-org-code', notFoundMessage);
                    updateTableCell('val-org-name', notFoundMessage);
                    updateOrAddCopyRow(notFoundMessage);
                    copyButton.disabled = true; // Disable the Copy button
                }
            } else {
                // response.ok is false (status is not 2xx)
                updateOrAddCopyRow("ไม่พบ");
            }
        } catch (error) {
            // ตามคำขอ: ไม่ต้องแสดง Error ใน Extension หรือ เก็บ Catch Error
            // หากเกิดข้อผิดพลาดที่ไม่คาดคิด (เช่น network error), UI อาจจะไม่ update หรือแสดงค่าล่าสุดก่อน error
            // console.error("An unexpected error occurred:", error); // สามารถ uncomment เพื่อ debug
        }
    });

    copyButton.addEventListener('click', async () => {
        const valueCell = document.getElementById('val-copy-data');
        if (valueCell && valueCell.textContent && valueCell.textContent !== "ไม่พบ" && valueCell.textContent !== "ไม่พบหน่วยบริการที่กำหนด") {
            const textToCopy = valueCell.textContent;
            try {
                await navigator.clipboard.writeText(textToCopy);
                copyButton.innerHTML = '<span class="material-symbols-outlined">done</span> Copy สำเร็จ';
                // Optionally, revert the button text after a few seconds
                // setTimeout(() => {
                //     copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span> Copy';
                // }, 2000);
            } catch (err) {
                // console.error('Failed to copy: ', err); // Optional: for debugging
                // As per requirement, do not show error to user in extension
            }
        }
    });
});
