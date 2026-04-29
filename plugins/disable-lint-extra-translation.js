const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * locales/ko.json 의 iOS 전용 Info.plist 키가 Android 의 values-b+ko/strings.xml
 * 로 함께 주입되면서 lintVitalRelease 의 ExtraTranslation 체크가 실패한다.
 * 해당 키들은 iOS 전용이라 Android 에는 대응 기본 문자열이 없어 정상이므로
 * 해당 룰만 disable.
 */
module.exports = function disableLintExtraTranslation(config) {
  return withAppBuildGradle(config, (config) => {
    const marker = '// disableLintExtraTranslation';
    if (config.modResults.contents.includes(marker)) {
      return config;
    }
    config.modResults.contents +=
      `\n${marker}\nandroid {\n    lint {\n        disable 'ExtraTranslation'\n    }\n}\n`;
    return config;
  });
};
