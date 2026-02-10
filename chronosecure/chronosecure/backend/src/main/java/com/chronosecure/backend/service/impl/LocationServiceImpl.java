package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.model.Location;
import com.chronosecure.backend.repository.LocationRepository;
import com.chronosecure.backend.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;

    @Override
    public Location createLocation(Location location) {
        return locationRepository.save(location);
    }

    @Override
    public List<Location> getLocationsByCompanyId(UUID companyId) {
        return locationRepository.findByCompanyId(companyId);
    }
}
