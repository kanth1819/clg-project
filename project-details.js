document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("id");

    if (!projectId) {
        // Show error message if Project ID is missing
        document.getElementById("errorContainer").classList.remove("d-none");
        document.getElementById("errorMessage").textContent = "Project ID is missing. Please provide a valid project ID.";
        document.getElementById("projectContainer").style.display = "none";
        return;
    }

    // Simulated project data (Replace with API/Firebase Fetch)
    const projects = {
        "123": {
            name: "Website Redesign",
            description: "Redesign the company website with a modern look.",
            dueDate: "2025-03-30",
            priority: "High",
            status: "In Progress",
            progress: 50,
            tasks: [
                { name: "Design Wireframes", status: "Completed" },
                { name: "Develop Frontend", status: "In Progress" }
            ],
            team: ["Alice", "Bob", "Charlie"]
        }
    };

    const project = projects[projectId];

    if (!project) {
        document.getElementById("errorContainer").classList.remove("d-none");
        document.getElementById("errorMessage").textContent = "Invalid Project ID. Project not found.";
        document.getElementById("projectContainer").style.display = "none";
        return;
    }

    // Populate project details
    document.getElementById("projectName").textContent = project.name;
    document.getElementById("projectDescription").textContent = project.description;
    document.getElementById("projectDueDate").textContent = project.dueDate;
    document.getElementById("projectPriority").textContent = project.priority;
    document.getElementById("projectStatus").textContent = project.status;
    document.getElementById("projectProgress").style.width = project.progress + "%";
    document.getElementById("projectProgress").textContent = project.progress + "%";

    // Populate tasks
    const tasksList = document.getElementById("tasksList");
    project.tasks.forEach(task => {
        const taskItem = document.createElement("div");
        taskItem.className = "list-group-item";
        taskItem.textContent = `${task.name} - ${task.status}`;
        tasksList.appendChild(taskItem);
    });

    // Populate team members
    const teamMembers = document.getElementById("teamMembers");
    project.team.forEach(member => {
        const memberDiv = document.createElement("div");
        memberDiv.className = "col-md-4";
        memberDiv.innerHTML = `<div class="card p-3">${member}</div>`;
        teamMembers.appendChild(memberDiv);
    });
});
