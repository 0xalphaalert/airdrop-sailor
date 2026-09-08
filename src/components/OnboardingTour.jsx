import { useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function OnboardingTour() {
  useEffect(() => {
    if (localStorage.getItem('hasSeenTour')) return;

    const steps = [
      {
        element: 'body',
        popover: {
          title: 'Welcome to AirdropSailor ⛵',
          description: "Your elite Web3 farming command center. Let's take a quick 30-second tour to get you started."
        }
      },
      {
        element: '#tour-market-ticker',
        popover: {
          title: 'Live Market & Gas',
          description: 'Monitor macro sentiment and ETH gas prices in real-time to time your transactions perfectly.'
        }
      },
      {
        element: '#tour-sidebar-farming',
        popover: {
          title: 'Your Dashboard',
          description: 'Track your active projects, daily tasks, and monitor your Sybil score all from here.'
        }
      },
      {
        element: '#tour-top-opportunities',
        popover: {
          title: 'AI-Curated Alpha',
          description: "We scan the market to find the highest-ROI, lowest-effort airdrops so you don't have to."
        }
      }
    ];

    if (document.querySelector('#tour-competition-banner')) {
      steps.push({
        element: '#tour-competition-banner',
        popover: {
          title: 'Win Real Rewards',
          description: 'Complete tasks, earn XP, and enter our live USDC giveaways!'
        }
      });
    }

    const driverObj = driver({
      popoverClass: 'driverjs-theme',
      showProgress: true,
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Start Farming 🚀',
      onDestroyed: () => {
        localStorage.setItem('hasSeenTour', 'true');
      },
      steps
    });

    driverObj.drive();
  }, []);

  return null;
}
