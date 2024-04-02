import { NextFunction, Request, Response } from "express";
import google_maps_api from "@google/maps";
import { Client, PlaceInputType } from "@googlemaps/google-maps-services-js";
import { ErrorClass } from "../utils";
import { config } from "dotenv";
import axios, { AxiosResponse } from "axios";
import { communities } from "../data.json";

config();

const google_maps_client = google_maps_api.createClient({
  key: process.env.GOOGLE_MAPS_API_KEY || "",
  Promise: Promise,
});
const google_maps_client2 = new Client({ axiosInstance: axios });
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

/**
 * The controller responsible for retrieving the list of Facebook groups within a specified location
 * @param req The Express Js request object
 * @param res The Express Js response object
 * @param next The Express Js Next function
 */
export const get_fb_groups = async (
  req: Request<
    any,
    any,
    any,
    {
      location: string;
      radius: number;
      visibility: string;
      min_members: number;
      group_type: string;
      unit: "km" | "miles";
    }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    // * Extract the query string from the request URL
    const {
      query: { location, radius, unit, group_type, min_members, visibility },
    } = req;

    // TODO: GET THE LONGITUDE AND LATITUDE OF THE SPECIFIED LOCATION USING THE GOOGLE MAPS GEOLOCATION API
    // * Make the API call to the Google maps Geo code API, to get the coordinates of the location
    const geo_code_response = await google_maps_client
      .geocode({ address: location })
      .asPromise()
      .catch((e) => {
        throw new ErrorClass(e.message || e, e.status || 500);
      });

    let geo_code_result: {
      location: { lat: number; lng: number };
      place_id: string;
    };

    // * If the response from the geo code API is a valid object/array
    if (typeof geo_code_response.json.results === "object") {
      const {
        json: { results },
      } = geo_code_response;
      geo_code_result = {
        location: { ...results[0].geometry.location },
        place_id: results[0].place_id,
      };
    }
    // * if no data was returned by the geo code API
    else
      throw new ErrorClass(`Could not get location with name ${location}`, 500);

    //TODO: GET THE PLACES (TOWNS) WITHIN THE SPECIFED LOCATION USING THE GOOGLE MAPS PLACES API
    let formatted_radius: number;

    // * Convert the passed unit to metres
    if (unit === "miles") formatted_radius = radius * 1609.34;
    else formatted_radius = radius * 1000;

    // * Make an API request to the Google maps nearby places API, to retrieve all places within a specific distance from the specified location
    const places_response = await google_maps_client2.placesNearby({
      params: {
        key: API_KEY,
        keyword: group_type || "community",
        radius: formatted_radius,
        location: geo_code_result.location,
        type: group_type || "community",
        // fields: ["name", "geometry", "formatted_address"],
        // locationbias: `circle:${formatted_radius}@${geo_code_result.location.lat},${geo_code_result.location.lng}`,
      },
    });

    // * If the response from the nearby places API is a valid object/array
    if (typeof places_response.data.results === "object") {
      const {
        data: { results },
      } = places_response;
      res.status(200).json(results);
      next();
    } else
      throw new ErrorClass(
        `Could not get places within ${radius} ${unit} of ${location}`,
        500
      );

    // ! REMOVE
    // res.status(200).json({ places: communities, groups: [{}] });

    // //TODO: GET THE FACEBOOK GROUPS WHICH ARE WITHIN THE RETRIEVED PLACES
    // //* Get the facebook groups the user belongs to
    // const all_groups = await axios
    //   .get<any, AxiosResponse<{ data: [] }, any>>(
    //     `https://graph.facebook.com/me/groups?access_token=${process.env.FACEBOOK_APP_API_KEY}`
    //   )
    //   .catch((e) => {
    //     throw new ErrorClass(e?.response?.data?.error?.message, 400);
    //   });

    // // * If 1 or more groups were returned
    // if (all_groups?.data?.data?.length > 0) {
    //   // TODO: FILTER THE GROUPS TO THOSE WHICH CONTAIN THE NAMES OF THE ANY OF THE PLACES RETURNED BY THE GOOGLE API
    // } else {
    //   // * Return a 404 response code implying there are no groups within that vicinity
    //   res.status(404).json({
    //     message: `No '${
    //       group_type || "community"
    //     }' groups within ${radius} ${unit} of ${location}`,
    //   });
    // }

    //TODO: FILTER THE FACEBOOK GROUPS TO COMMUNITIES, AND PRIVATE GROUPS ONLY
    next();
  } catch (error: any) {
    console.error(`An error occurred: `, error.message || error);
    next(error);
  }
};
