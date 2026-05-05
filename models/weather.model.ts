export interface OpenWeatherResponse {
  name: string;
  sys: {
    country: string;
  };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
  }>;
}

export interface OpenWeatherForecastEntry {
  dt_txt: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
  }>;
}

export interface OpenWeatherForecastResponse {
  city: {
    name: string;
    country: string;
  };
  list: OpenWeatherForecastEntry[];
}
