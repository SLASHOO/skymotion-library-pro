console.log("SM LIBRARY PRO — LOCAL DEV ACTIVE");

const root = document.getElementById("sm-library-pro");

if (!root) {
  console.error("Missing #sm-library-pro container");
} else {
  root.innerHTML = `
    <div class="sm-test-card">
      <h1>SkyMotion Library Pro</h1>
      <p>Local prototype is running. Now we can build the real Library v2 step by step.</p>
    </div>
  `;
}