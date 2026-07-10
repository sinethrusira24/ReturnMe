import { auth, db, storage } from './firebase-config.js';

import { 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import { showToast } from './toast.js';



document.addEventListener("DOMContentLoaded", () => {


const form = document.getElementById("editReportForm");

const reportId = new URLSearchParams(window.location.search).get("id");


if (!reportId) {

    showToast("Report ID not found", "error");

    window.location.href = "profile.html";

    return;

}




let oldImageUrl = "";

let reportData = {};




// ===============================
// AUTH CHECK + LOAD REPORT
// ===============================


onAuthStateChanged(auth, async (user) => {


    if (!user) {

        window.location.href = "login.html";

        return;

    }



    try {


        const reportRef = doc(db, "reports", reportId);

        const reportSnap = await getDoc(reportRef);



        if (!reportSnap.exists()) {

            showToast("Report not found", "error");

            window.location.href = "profile.html";

            return;

        }



        reportData = reportSnap.data();



        // store old image
        oldImageUrl = reportData.imageUrl || "";



        // Fill inputs

        document.getElementById("fullName").value =
            reportData.reporterName || "";

        document.getElementById("email").value =
            reportData.email || "";

        document.getElementById("phone").value =
            reportData.phone || "";

        document.getElementById("itemName").value =
            reportData.itemName || "";

        document.getElementById("itemCategory").value =
            reportData.category || "other";

        document.getElementById("reportDate").value =
            reportData.date || "";

        document.getElementById("location").value =
            reportData.location || "";

        document.getElementById("description").value =
            reportData.description || "";



    } catch(error) {

        console.error(error);

        showToast("Failed to load report", "error");

    }


});





// ===============================
// UPDATE REPORT
// ===============================


form.addEventListener("submit", async (e)=>{


e.preventDefault();



try {


    const imageFile = document.getElementById("newImage").files[0];


    let imageUrl = oldImageUrl;



    // Upload new image if selected

    if(imageFile){


        const imageRef = ref(
            storage,
            `reports/${Date.now()}_${imageFile.name}`
        );


        await uploadBytes(imageRef, imageFile);


        imageUrl = await getDownloadURL(imageRef);


    }





    const updatedReport = {


        email:
        document.getElementById("email").value.trim(),


        phone:
        document.getElementById("phone").value.trim(),


        itemName:
        document.getElementById("itemName").value.trim(),


        category:
        document.getElementById("itemCategory").value,


        date:
        document.getElementById("reportDate").value,


        location:
        document.getElementById("location").value.trim(),


        description:
        document.getElementById("description").value.trim(),


        imageUrl:imageUrl,


        // keep old values

        reporterId:
        reportData.reporterId,


        reporterName:
        reportData.reporterName,


        type:
        reportData.type,


        status:
        reportData.status,


        createdAt:
        reportData.createdAt,


        expireAt:
reportData.expireAt || (Date.now() + 7 * 24 * 60 * 60 * 1000)

    };





    await updateDoc(
        doc(db,"reports",reportId),
        updatedReport
    );



    showToast(
        "Report updated successfully!",
        "success"
    );



    setTimeout(()=>{

        window.location.href="my-profile.html";

    },1500);



}
catch(error){


    console.error(
        "Update error:",
        error
    );


    showToast(
        "Failed to update report",
        "error"
    );


}



});



});