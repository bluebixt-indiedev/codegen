const API = {
  token: localStorage.getItem("codegen_token") || ""
};

document.addEventListener("DOMContentLoaded", async () => {
  if (!API.token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userRes = await fetch("/api/auth/user", {
      headers: {
        Authorization: `Bearer ${API.token}`
      }
    });

    if (!userRes.ok) {
      throw new Error("Not authenticated");
    }

    const user = await userRes.json();

    const repoGrid = document.getElementById("repoGrid");

    const reposRes = await fetch("/api/repositories", {
      headers: {
        Authorization: `Bearer ${API.token}`
      }
    });

    if (!reposRes.ok) {
      throw new Error("Repositories failed");
    }

    const repos = await reposRes.json();

    if (!repos.length) {
      repoGrid.innerHTML = `
        <div class="empty">
          <p>No repositories yet.</p>
          <p>Create your first Git repository.</p>
        </div>
      `;
      return;
    }

    repoGrid.innerHTML = repos.map(repo => `
      <div class="repo-card">
        <h3>${repo.name}</h3>
        <p>${repo.description || "No description provided."}</p>
        <div class="repo-meta">
          <span>Owner: ${repo.owner}</span>
          <span>${repo.created_at}</span>
        </div>
        <div class="repo-actions">
          <button class="clone" data-name="${repo.name}" data-owner="${repo.owner}">Clone</button>
          <button class="delete" data-id="${repo.id}">Delete</button>
        </div>
      </div>
    `).join("");

repoGrid.innerHTML = repos.map(repo =>
`<div id="commitModal" class="modal" aria-modal="true">
  <div class="modal-content">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2>Create commit</h2>
      <button id="closeCommitModalBtn" class="btn secondary" style="border:none;">×</button>
    </div>

    <form id="commitForm">
      <label class="label" for="commitRepoName">Repository</label>
      <input class="input" id="commitRepoName" name="repo_name" type="text" placeholder="repo-name" required />

      <label class="label" for="commitMessage">Commit message</label>
      <input class="input" id="commitMessage" name="message" placeholder="Initial commit" />

      <label class="label" for="commitFiles">Files JSON</label>
      <textarea
        class="textarea"
        id="commitFiles"
        name="files"
        placeholder='[{"path":"README.md","content":"hello world"}]'
      ></textarea>

      <div id="commitError" class="error"></div>

      <button class="btn primary" type="submit" style="width:100%; margin-top:10px;">Commit changes</button>
    </form>
  </div>
</div>`).join("");

    document.querySelectorAll(".clone").forEach(btn => {
      btn.addEventListener("click", () => {
        const owner = btn.dataset.owner;
        const name = btn.dataset.name;
        alert(`git clone https://codegencc.web.app/${owner}/${name}.git`);
      });
    });

    document.querySelectorAll(".delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this repository?")) return;

        const res = await fetch(`/api/repositories/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${API.token}`
          }
        });

        if (res.ok) {
          location.reload();
        } else {
          alert("Repository deletion failed.");
        }
      });
    });

  } catch (error) {
    console.error(error);
    window.location.href = "login.html";
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("codegen_token");
  localStorage.removeItem("codegen_user");
  window.location.href = "login.html";
});

document.getElementById("newRepoBtn")?.addEventListener("click", () => {
  document.getElementById("repoModal").classList.add("show");
});

document.getElementById("closeModalBtn")?.addEventListener("click", () => {
  document.getElementById("repoModal").classList.remove("show");
});

document.getElementById("repoForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("repoName").value.trim();
  const description = document.getElementById("repoDescription").value.trim();

  if (!name) {
    document.getElementById("repoError").textContent = "Repository name is required.";
    return;
  }

  try {
    const res = await fetch("/api/repositories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API.token}`
      },
      body: JSON.stringify({
        name,
        description
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Repository creation failed.");
    }

    document.getElementById("repoForm").reset();
    document.getElementById("repoModal").classList.remove("show");
    document.getElementById("statusBox").style.display = "block";
    document.getElementById("statusBox").textContent = `Repository created: ${name}`;

    setTimeout(() => {
      location.reload();
    }, 700);

  } catch (error) {
    document.getElementById("repoError").textContent = error.message;
  }
});