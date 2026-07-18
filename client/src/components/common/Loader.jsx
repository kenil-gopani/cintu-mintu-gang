import React from 'react';
import styled from 'styled-components';

const Loader = ({ scale = 1, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <StyledWrapper $scale={scale}>
        <div className="cloud-wrapper">
          <div className="cloud">
            <svg className="arrows" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
              <g>
                <path d="M33.52,68.12 C35.02,62.8 39.03,58.52 44.24,56.69 C49.26,54.93 54.68,55.61 59.04,58.4 C59.04,58.4 56.24,60.53 56.24,60.53 C55.45,61.13 55.68,62.37 56.63,62.64 C56.63,62.64 67.21,65.66 67.21,65.66 C67.98,65.88 68.75,65.3 68.74,64.5 C68.74,64.5 68.68,53.5 68.68,53.5 C68.67,52.51 67.54,51.95 66.75,52.55 C66.75,52.55 64.04,54.61 64.04,54.61 C57.88,49.79 49.73,48.4 42.25,51.03 C35.2,53.51 29.78,59.29 27.74,66.49 C27.29,68.08 28.22,69.74 29.81,70.19 C30.09,70.27 30.36,70.31 30.63,70.31 C31.94,70.31 33.14,69.44 33.52,68.12Z" />
                <path d="M69.95,74.85 C68.35,74.4 66.7,75.32 66.25,76.92 C64.74,82.24 60.73,86.51 55.52,88.35 C50.51,90.11 45.09,89.43 40.73,86.63 C40.73,86.63 43.53,84.51 43.53,84.51 C44.31,83.91 44.08,82.67 43.13,82.4 C43.13,82.4 32.55,79.38 32.55,79.38 C31.78,79.16 31.02,79.74 31.02,80.54 C31.02,80.54 31.09,91.54 31.09,91.54 C31.09,92.53 32.22,93.09 33.01,92.49 C33.01,92.49 35.72,90.43 35.72,90.43 C39.81,93.63 44.77,95.32 49.84,95.32 C52.41,95.32 55,94.89 57.51,94.01 C64.56,91.53 69.99,85.75 72.02,78.55 C72.47,76.95 71.54,75.3 69.95,74.85Z" />
              </g>
            </svg>
          </div>
          <div className="cloud-shadow"></div>
        </div>
      </StyledWrapper>
    </div>
  );
}

const StyledWrapper = styled.div`
  width: ${props => 80 * props.$scale}px;
  height: ${props => 60 * props.$scale}px;
  display: flex;
  align-items: center;
  justify-content: center;

  .cloud-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: scale(${props => props.$scale});
    transform-origin: center;
  }

  .cloud {
    width: 60px;
    height: 20px;
    background: #4387f4;
    border-radius: 50px;
    position: relative;
    animation: float 2s ease-in-out infinite;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .arrows {
    width: 50px;
    height: 50px;
    position: absolute;
    top: -15px; /* Center perfectly on the cloud */
    fill: #80b1ff;
    animation: rotation 1s linear infinite;
    transform-origin: 50% 72.8938%; /* Matches the original SVG rotation pivot */
    z-index: 15;
  }

  .cloud::before, .cloud::after {
    content: '';
    position: absolute;
    background: #4387f4;
    border-radius: 50%;
  }

  .cloud::before {
    width: 25px;
    height: 25px;
    top: -12px;
    left: 8px;
  }

  .cloud::after {
    width: 35px;
    height: 35px;
    top: -20px;
    right: 8px;
  }

  .cloud-shadow {
    width: 45px;
    height: 6px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    margin-top: 15px;
    animation: shadow 2s ease-in-out infinite;
  }

  /* Support for Dark Mode Shadow */
  @media (prefers-color-scheme: dark) {
    .cloud-shadow {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  @keyframes shadow {
    0%, 100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(0.7);
      opacity: 0.3;
    }
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(180deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export default Loader;
