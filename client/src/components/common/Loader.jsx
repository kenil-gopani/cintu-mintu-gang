import React from 'react';
import styled from 'styled-components';

const Loader = ({ scale = 1, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <StyledWrapper $scale={scale}>
        <div className="cloud-wrapper">
          <div className="cloud"></div>
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
`;

export default Loader;
