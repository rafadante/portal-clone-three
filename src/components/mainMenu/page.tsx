"use client"

import "./chambers.css"

import { useState, useEffect, type CSSProperties } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Heart, MessageCircle, Trophy, Zap, Star, Filter, X } from "lucide-react"
import { ProjectManager, type Project } from "../../utils/project-manager"

interface Template {
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

const mockTemplates: Template[] = [
  /**{
    id: "1",
    title: "Title Template",
    likes: 128,
    comments: 5,
    category: "Action",
    difficulty: "Medium",
    thumbnail: "/gaming-template-interface-dark-theme.jpg",
    description:
      "Esta é uma descrição detalhada do template que explica suas funcionalidades e características principais. O template oferece uma experiência completa com diversos recursos integrados.",
    leaderboard: [
      { username: "username12345", score: "3:85", portals: 2, steps: 23 },
      { username: "username12345", score: "3:85", portals: 2, steps: 23 },
      { username: "username12345", score: "3:85", portals: 2, steps: 23 },
      { username: "username12345", score: "3:85", portals: 2, steps: 23 },
    ],
  },
  {
    id: "2",
    title: "Adventure Quest",
    likes: 89,
    comments: 12,
    category: "Adventure",
    difficulty: "Hard",
    thumbnail: "/fantasy-adventure-game-interface-with-mountains-an.jpg",
    description:
      "Um template de aventura épica com múltiplos desafios e recompensas. Perfeito para criar experiências imersivas e envolventes.",
    leaderboard: [
      { username: "player001", score: "4:12", portals: 3, steps: 45 },
      { username: "gamer_pro", score: "4:25", portals: 3, steps: 38 },
      { username: "speedrun_king", score: "3:58", portals: 2, steps: 52 },
    ],
  },
  {
    id: "3",
    title: "Puzzle Master",
    likes: 156,
    comments: 8,
    category: "Puzzle",
    difficulty: "Easy",
    thumbnail: "/puzzle-game-interface-with-geometric-shapes-and-br.jpg",
    description:
      "Template focado em quebra-cabeças complexos e desafios mentais. Ideal para testar habilidades de raciocínio lógico.",
    leaderboard: [
      { username: "brain_master", score: "2:34", portals: 1, steps: 15 },
      { username: "logic_wizard", score: "2:45", portals: 1, steps: 18 },
      { username: "puzzle_solver", score: "3:12", portals: 2, steps: 22 },
    ],
  }, */
]

export default function InteractiveMenu() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All")
  const [sortBy, setSortBy] = useState<string>("popularity")
  const [showFilters, setShowFilters] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [dynamicProjects, setDynamicProjects] = useState<Project[]>([])

  const handlePlay = (template: Template) => {
    console.log(`[v0] Playing template: ${template.title}`);
    (window as { [key: string]: any })["playCustom"](template.thumbnail, template.path, template.title, template.finished, template.played, template.elemMine);
    //alert(`Starting ${template.title}...`)
    // Here you would implement the actual play functionality
    // For example: window.open(`/play/${template.id}`, '_blank')
  }

  const handleEdit = (template: Template) => {
    console.log(`[v0] Editing template: ${template.title}`)
    alert(`Opening editor for ${template.title}...`)
    // Here you would implement the edit functionality
    // For example: window.open(`/editor/${template.id}`, '_blank')
  }

  const handleQueue = (template: Template) => {
    console.log(`[v0] Adding to queue: ${template.title}`)
    alert(`${template.title} added to queue!`)
    // Here you would implement queue functionality
    // For example: addToQueue(template.id)
  }

  const handleDelete = (template: Template) => {
    console.log(`[v0] Deleting template: ${template.title}`)
    /*if (confirm(`Are you sure you want to delete "${template.title}"?`)) {
      // Remove from dynamic projects if it exists there
      if (dynamicProjects.find((p) => p.id === template.id)) {
        ProjectManager.removeProject(template.id)
      }
      alert(`${template.title} has been deleted!`)
      setShowMenu(false)
    }*/
  }

  useEffect(() => {
    const unsubscribe = ProjectManager.subscribe((projects) => {
      setDynamicProjects(projects)
    })

    // Initialize with any existing projects
    setDynamicProjects(ProjectManager.getProjects())

    return unsubscribe
  }, [])

  const allTemplates = [...mockTemplates, ...dynamicProjects]

  const categories = ["All", ...Array.from(new Set(allTemplates.map((t) => t.category)))]
  const difficulties = ["All", "Easy", "Medium", "Hard"]

  const filteredTemplates = allTemplates
    .filter(
      (template) =>
        (selectedCategory === "All" || template.category === selectedCategory) &&
        (selectedDifficulty === "All" || template.difficulty === selectedDifficulty),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          return b.likes - a.likes
        case "comments":
          return b.comments - a.comments
        case "name":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  const clearFilters = () => {
    setSelectedCategory("All")
    setSelectedDifficulty("All")
    setSortBy("popularity")
  }

  return (
    <div className="aperture-chambers" style={{ "--chamber-background": `url(${process.env.PUBLIC_URL}/community/4.webp)` } as CSSProperties}>
      <aside className="aperture-sidebar">
        <div className="aperture-brand"><span className="aperture-symbol" aria-hidden="true">◉</span><div>APERTURE<small>LABORATORIES</small></div></div>
        <button id="back-main2" className="aperture-back"><span aria-hidden="true">←</span> BACK</button>
        <div className="aperture-current"><span aria-hidden="true">◇</span> CUSTOM CHAMBERS</div>
        <button className="aperture-filter-toggle" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><Filter size={19} /> FILTERS</button>
        <nav aria-label="Chamber categories">
          {[{ key: "All", label: "All chambers" }, { key: "My chambers", label: "My chambers" }, { key: "Others", label: "Community" }].map(({ key, label }) => (
            <button key={key} className={selectedCategory === key ? "is-selected" : ""} aria-pressed={selectedCategory === key} onClick={() => setSelectedCategory(key)}>
              <span>{label}</span><span>{key === "All" ? allTemplates.length : allTemplates.filter(t => t.category === key).length}</span>
            </button>
          ))}
        </nav>
        <div className="aperture-sidebar-footer"><span className="aperture-status-light" /> COMMUNITY TESTING<br /><small>Science is a collaborative effort.</small></div>
      </aside>
      <div className="aperture-content">
        <div className="flex-shrink-0">
          <header className="aperture-heading"><h1>CUSTOM CHAMBERS</h1><p>TESTING INITIATIVE <span /></p></header>
          <div className="aperture-tools">
            <div className="aperture-results" aria-live="polite">SHOWING {filteredTemplates.length} OF {allTemplates.length} CHAMBERS</div>
            {showFilters && (
              <Card className="mt-4 border border-slate-700 bg-slate-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-cyan-300 mb-2 block">State</label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <Button
                            key={category}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className={`text-xs transition-all duration-300 border-0 ${selectedCategory === category
                              ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg"
                              : "bg-slate-600 hover:bg-slate-500 text-slate-200"
                              }`}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-purple-300 mb-2 block">Category</label>
                      <div className="flex flex-wrap gap-2">
                        {difficulties.map((difficulty) => (
                          <Button
                            key={difficulty}
                            size="sm"
                            onClick={() => setSelectedDifficulty(difficulty)}
                            className={`text-xs transition-all duration-300 border-0 ${selectedDifficulty === difficulty
                              ? "bg-purple-500 hover:bg-purple-600 text-white shadow-lg"
                              : "bg-slate-600 hover:bg-slate-500 text-slate-200"
                              }`}
                          >
                            {difficulty}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-yellow-300 mb-2 block">Sort by</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: "popularity", label: "Popularity" },
                          { key: "comments", label: "Comments" },
                          { key: "name", label: "Name" },
                        ].map((sort) => (
                          <Button
                            key={sort.key}
                            size="sm"
                            onClick={() => setSortBy(sort.key)}
                            className={`text-xs transition-all duration-300 border-0 ${sortBy === sort.key
                              ? "bg-yellow-500 hover:bg-yellow-600 text-slate-900 shadow-lg font-semibold"
                              : "bg-slate-600 hover:bg-slate-500 text-slate-200"
                              }`}
                          >
                            {sort.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={clearFilters}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white text-xs shadow-lg transition-all duration-300 hover:scale-105 border-0"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="aperture-scroll custom-scrollbar">
          <div className="aperture-grid">
            {filteredTemplates.map((template, index) => (
              <Card
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template)
                  setShowMenu(true)
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open ${template.title}`}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedTemplate(template); setShowMenu(true); } }}
                className="aperture-chamber-card"
              >
                {/* ... existing card content ... */}
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={template.thumbnail || "/placeholder.svg"}
                    alt={`${template.title} thumbnail`}
                    className="w-full h-32 object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  <div className="absolute top-2 right-2 ranking-badge">#{index + 1}</div>
                  <div className="absolute top-2 left-2 category-badge">{template.category}</div>
                  <div
                    className={`absolute bottom-2 left-2 ${template.difficulty === "Easy"
                      ? "difficulty-badge-easy"
                      : template.difficulty === "Medium"
                        ? "difficulty-badge-medium"
                        : "difficulty-badge-hard"
                      }`}
                  >
                    {template.difficulty}
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    {template.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm mb-3">
                    <div className="flex items-center gap-1 text-pink-300">
                      <Heart className="w-4 h-4" />
                      <span className="font-semibold text-white">{template.likes}</span>
                    </div>
                    <div className="flex items-center gap-1 text-cyan-300">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-semibold text-white">{template.comments}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-300">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold text-xs text-yellow-200">EPIC</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-xs line-clamp-2">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="col-span-full">
              <Card className="border border-slate-700 bg-slate-800">
                <CardContent className="p-6 text-center">
                  <div className="text-slate-400 mb-2">
                    <Filter className="w-12 h-12 mx-auto mb-3" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No chambers found</h3>
                  <p className="text-slate-300 text-sm mb-4">Try adjusting the filters to find more chambers</p>
                  <Button
                    onClick={clearFilters}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {showMenu && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowMenu(false)}>
            <div
              className="w-full max-w-2xl bg-slate-800 h-full overflow-y-auto shadow-2xl transform transition-transform duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Chamber Details</h2>
                <Button
                  onClick={() => setShowMenu(false)}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {selectedTemplate ? (
                <div className="p-6 space-y-6">
                  <div className="relative overflow-hidden rounded-lg">
                    <img
                      src={selectedTemplate.thumbnail || "/placeholder.svg"}
                      alt={`${selectedTemplate.title} thumbnail`}
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      {selectedTemplate.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1 text-pink-300">
                        <Heart className="w-4 h-4 fill-current" />
                        <span className="font-semibold text-white">{selectedTemplate.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-cyan-300">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-semibold text-white">{selectedTemplate.comments}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <Button
                        onClick={() => handlePlay(selectedTemplate)}
                        className="bg-green-600 hover:bg-green-700 text-white border-0 transition-all duration-300 hover:scale-105"
                      >
                        <div className="w-4 h-4 mr-2">▶</div>
                        Play
                      </Button>

                      {selectedTemplate.elemMine == "mine" && <Button
                        onClick={() => handleEdit(selectedTemplate)}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 transition-all duration-300 hover:scale-105"
                      >
                        <div className="w-4 h-4 mr-2">✏</div>
                        Edit
                      </Button>}

                      {selectedTemplate.elemMine != "mine" && <Button
                        onClick={() => handleQueue(selectedTemplate)}
                        className="bg-orange-600 hover:bg-orange-700 text-white border-0 transition-all duration-300 hover:scale-105"
                      >
                        <div className="w-4 h-4 mr-2">📋</div>
                        Queue
                      </Button>}

                      {selectedTemplate.elemMine == "mine" && <Button
                        onClick={() => handleDelete(selectedTemplate)}
                        className="bg-red-600 hover:bg-red-700 text-white border-0 transition-all duration-300 hover:scale-105"
                      >
                        <div className="w-4 h-4 mr-2">🗑</div>
                        Delete
                      </Button>}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        Description
                      </h4>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs shadow-lg transition-all duration-300 hover:scale-105 border-0"
                      >
                        Show all scores
                      </Button>
                    </div>

                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">{selectedTemplate.description}</p>

                    <div className="space-y-3 max-h-80 overflow-y-auto leaderboard-scrollbar">
                      {selectedTemplate.leaderboard.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-cyan-400 hover:bg-slate-600 transition-all duration-300"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0
                                ? "bg-yellow-400 text-slate-900"
                                : index === 1
                                  ? "bg-slate-300 text-slate-900"
                                  : index === 2
                                    ? "bg-orange-500 text-white"
                                    : "bg-slate-500 text-white"
                                }`}
                            >
                              <span className="text-current font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{entry.username}</div>
                              <div className="text-xs text-slate-300">
                                <span className="text-cyan-300 font-semibold">{entry.score}</span>, {entry.portals}{" "}
                                Portals, {entry.steps} Steps
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <div className="text-slate-400 mb-4">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Select a Chamber</h3>
                  <p className="text-slate-300 text-sm">Click on one of the cards to see details and leaderboard</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
