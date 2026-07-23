import { useState, useEffect } from 'react';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import type { Project, Task } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    projectService.getAll().then(setProjects);
  }, []);

  const toggleProject = async (projectId: number) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
      setTasks([]);
    } else {
      setExpandedProject(projectId);
      const t = await taskService.getByProject(projectId);
      setTasks(t);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projets</h1>
        <p className="page-subtitle">Liste detaillee des projets et taches</p>
      </div>

      {projects.map((project) => (
        <div key={project.id} className="card">
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => toggleProject(project.id)}
          >
            {expandedProject === project.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>{project.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{project.description}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Progression</div>
                <div style={{ fontWeight: 600 }}>{project.globalProgress}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Temps</div>
                <div style={{ fontWeight: 600 }}>{Math.round(project.totalTimeSpentMinutes / 60)}h</div>
              </div>
              <div className="progress-bar" style={{ width: 80 }}>
                <div className={`progress-fill ${project.globalProgress === 100 ? 'success' : ''}`} style={{ width: `${project.globalProgress}%` }} />
              </div>
            </div>
          </div>

          {expandedProject === project.id && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tache</th>
                    <th>Assignee</th>
                    <th>Statut</th>
                    <th>Progression</th>
                    <th>Temps</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.name}</td>
                      <td>{task.assigneeName || '-'}</td>
                      <td>
                        <span className={`badge ${task.status === 'TERMINE' ? 'badge-success' : task.status === 'BLOQUE' ? 'badge-danger' : 'badge-info'}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className="progress-fill" style={{ width: `${task.progressPercent}%` }} />
                          </div>
                          <span style={{ fontSize: '0.75rem' }}>{task.progressPercent}%</span>
                        </div>
                      </td>
                      <td>{Math.round(task.totalTimeSpentMinutes / 60)}h / {task.estimatedHours || '?'}h</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-light)', maxWidth: 200 }}>{task.technicalComment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
