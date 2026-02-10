package com.chronosecure.backend.service;

import com.chronosecure.backend.model.Location;

import java.util.List;
import java.util.UUID;

public interface LocationService {
    Location createLocation(Location location);

    List<Location> getLocationsByCompanyId(UUID companyId);
}
