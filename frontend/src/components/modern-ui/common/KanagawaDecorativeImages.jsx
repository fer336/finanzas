import PropTypes from 'prop-types';
import { kanagawaAssets } from '../../../theme/kanagawa-assets';

export function KanagawaDashboardBackground({ isDarkMode }) {
  const isLight = !isDarkMode;
  const desktopSrc = isLight ? kanagawaAssets.dashboardBackgroundLight : kanagawaAssets.dashboardBackgroundDark;
  const mobileSrc = isLight ? kanagawaAssets.dashboardBackgroundLightMobile : kanagawaAssets.dashboardBackgroundDarkMobile;

  return (
    <picture aria-hidden="true">
      <source media="(max-width: 900px)" srcSet={mobileSrc} />
      <img
        src={desktopSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`kanagawa-dashboard-background ${isLight ? 'kanagawa-dashboard-background-light' : 'kanagawa-dashboard-background-dark'}`}
      />
    </picture>
  );
}

KanagawaDashboardBackground.propTypes = {
  isDarkMode: PropTypes.bool,
};

export function DecorativeCardImage({ src, className = '' }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`card-art ${className}`}
    />
  );
}

DecorativeCardImage.propTypes = {
  src: PropTypes.string.isRequired,
  className: PropTypes.string,
};
