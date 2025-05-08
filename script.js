document.getElementById("imageUpload").addEventListener("change", function () {
  const preview = document.getElementById("preview");
  preview.innerHTML = "";
  const file = this.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});

document.querySelectorAll(".template").forEach((template) => {
  template.addEventListener("click", function () {
    document.querySelectorAll(".template").forEach((el) => el.classList.remove("selected"));
    this.classList.add("selected");

    // Hide all custom fields
    document.querySelectorAll(".custom-inputs").forEach((section) =>
      section.classList.add("hidden")
    );

    // Show custom fields for selected character
    const character = this.dataset.character;
    if (character === "Operation Bravo") {
      document.getElementById("operation-bravo-fields").classList.remove("hidden");
    } else if (character === "Grendals") {
      document.getElementById("grendals-fields").classList.remove("hidden");
    } else if (character === "Trash Can Kids") {
      document.getElementById("trash-can-kids-fields").classList.remove("hidden");
    }
  });
});

document.getElementById("customizer-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const selected = document.querySelector(".template.selected");
  const uploadedFile = document.getElementById("imageUpload").files[0];
  const spinner = document.getElementById("spinner");
  const preview = document.getElementById("preview");

  if (!selected || !uploadedFile) {
    alert("Please upload a photo and select a character template.");
    return;
  }

  const formData = new FormData();
  formData.append("photo", uploadedFile);
  formData.append("character", selected.dataset.character);

  // Append custom fields based on selected character
  const character = selected.dataset.character;
  if (character === "Operation Bravo") {
    formData.append("weaponType", document.getElementById("weaponType").value);
    formData.append("combatStyle", document.getElementById("combatStyle").value);
  } else if (character === "Grendals") {
    formData.append("dominantTrait", document.getElementById("dominantTrait").value);
    formData.append("visualStyle", document.getElementById("visualStyle").value);
  } else if (character === "Trash Can Kids") {
    formData.append("favoriteItem", document.getElementById("favoriteItem").value);
    formData.append("favoriteActivity", document.getElementById("favoriteActivity").value);
  }

  spinner.style.display = "block";
  preview.innerHTML = "";

  try {
    const response = await fetch("https://retrocardtest.onrender.com/generate", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    spinner.style.display = "none";

    if (data.imageUrl) {
  preview.innerHTML = `
    <img src="${data.imageUrl}" alt="Generated Image" id="generatedImage" />
    <a href="${data.imageUrl}" download="retrocards-image.png" id="downloadBtn">
      <button class="download-button">Download Image</button>
    </a>
  `;
}
});
