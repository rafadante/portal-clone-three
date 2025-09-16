// Global project management utilities
export interface Project {
    id: string
    title: string
    likes: number
    comments: number
    thumbnail: string
    description: string
    category: string
    difficulty: "Easy" | "Medium" | "Hard"
    leaderboard: Array<{
        username: string
        score: string
        portals: number
        steps: number
    }>
    path: string
    user_id: string
    chamber_id: string
    elemMine: string
    finished: boolean
  played: boolean
}

// Global project store
let globalProjects: Project[] = []
let projectListeners: Array<(projects: Project[]) => void> = []

export const ProjectManager = {
    // Add a new project
    addProject: (project: Omit<Project, "id">) => {
        const newProject: Project = {
            ...project,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }
        globalProjects = [...globalProjects, newProject]
        notifyListeners()
        return newProject
    },

    // Add multiple projects at once
    addProjects: (projects: Array<Omit<Project, "id">>) => {
        const newProjects = projects.map((project) => ({
            ...project,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }))
        globalProjects = [...globalProjects, ...newProjects]
        notifyListeners()
        return newProjects
    },

    // Update an existing project
    updateProject: (id: string, updates: Partial<Project>) => {
        globalProjects = globalProjects.map((project) => (project.id === id ? { ...project, ...updates } : project))
        notifyListeners()
        return globalProjects.find((p) => p.id === id)
    },

    // Remove a project
    removeProject: (id: string) => {
        globalProjects = globalProjects.filter((project) => project.id !== id)
        notifyListeners()
    },

    // Get all projects
    getProjects: () => [...globalProjects],

    // Get project by ID
    getProject: (id: string) => globalProjects.find((p) => p.id === id),

    // Clear all projects
    clearProjects: () => {
        globalProjects = []
        notifyListeners()
    },

    // Set initial projects (useful for API data)
    setProjects: (projects: Project[]) => {
        globalProjects = [...projects]
        notifyListeners()
    },

    // Subscribe to project changes
    subscribe: (listener: (projects: Project[]) => void) => {
        projectListeners.push(listener)
        return () => {
            projectListeners = projectListeners.filter((l) => l !== listener)
        }
    },

    // Add leaderboard entry to a project
    addLeaderboardEntry: (
        projectId: string,
        entry: {
            username: string
            score: string
            portals: number
            steps: number
        },
    ) => {
        const project = globalProjects.find((p) => p.id === projectId)
        if (project) {
            project.leaderboard = [...project.leaderboard, entry]
            notifyListeners()
        }
    },

    // Update project stats (likes, comments)
    updateStats: (projectId: string, stats: { likes?: number; comments?: number }) => {
        globalProjects = globalProjects.map((project) =>
            project.id === projectId
                ? {
                    ...project,
                    likes: stats.likes ?? project.likes,
                    comments: stats.comments ?? project.comments,
                }
                : project,
        )
        notifyListeners()
    },
}

// Notify all listeners of changes
function notifyListeners() {
    projectListeners.forEach((listener) => listener([...globalProjects]))
}

// Make ProjectManager globally available
if (typeof window !== "undefined") {
    ; (window as any).ProjectManager = ProjectManager
}

// API integration helpers
export const APIHelpers = {
    // Fetch projects from API and add to store
    fetchAndAddProjects: async (apiUrl: string) => {
        try {
            const response = await fetch(apiUrl)
            const projects = await response.json()
            ProjectManager.addProjects(projects)
            return projects
        } catch (error) {
            console.error("Error fetching projects:", error)
            throw error
        }
    },

    // Send project to API and add to store
    createProjectViaAPI: async (apiUrl: string, project: Omit<Project, "id">) => {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(project),
            })
            const createdProject = await response.json()
            ProjectManager.addProject(createdProject)
            return createdProject
        } catch (error) {
            console.error("Error creating project:", error)
            throw error
        }
    },
}
