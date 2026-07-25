// src/mobile/pages/ProjectDetailsPageMobile.jsx
import React from 'react';
import ProjectHeader from '../components/project-details/ProjectHeader';
import ProjectHero from '../components/project-details/ProjectHero';
import ProjectStatsGrid from '../components/project-details/ProjectStatsGrid';
import TabNavigation from '../components/project-details/TabNavigation';
import BottomNavigation from '../components/navigation/BottomNavigation';
import OverviewTab from '../components/project-details/tabs/OverviewTab';
import StepByStepTab from '../components/project-details/tabs/StepByStepTab';
import FundingTab from '../components/project-details/tabs/FundingTab';
import DiscordAlpha from '../components/project-details/tabs/DiscordAlpha';
import Tokenomics from '../components/project-details/tabs/Tokenomics';
import AIResearch from '../components/project-details/tabs/AIResearch';

export default function ProjectDetailsPageMobile({
  project,
  loading,
  tasks,
  score,
  hasImported,
  isImporting,
  isUntracking,
  handleImportProject,
  handleUntrackProject,
  activeTab,
  setActiveTab,
  discordRoles,
  discordActivities,
}) {

  if (loading || !project) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white font-sans text-slate-900">
      
      <ProjectHeader />

      <main className="w-full pt-0">
        <div className="pt-2">
          <ProjectHero 
            project={project} 
            score={score}
            hasImported={hasImported}
            isImporting={isImporting}
            isUntracking={isUntracking}
            onTrack={handleImportProject}
            onUntrack={handleUntrackProject}
          />
        </div>
        
        <ProjectStatsGrid project={project} tasksCount={tasks?.length || 0} />
        
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* TAB CONTENT */}
        <div className="bg-slate-50 min-h-[50px] pb-14">
          {activeTab === 'overview' && <OverviewTab project={project} />}
          {activeTab === 'step-by-step' && <StepByStepTab project={project} tasks={tasks} />}
          {activeTab === 'funding' && <FundingTab project={project} />}
          {activeTab === 'discord' && <DiscordAlpha roles={discordRoles} activities={discordActivities} />}
          {activeTab === 'tokenomics' && <Tokenomics project={project} />}
          {activeTab === 'research' && <AIResearch project={project} />}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}