'use client';

import {
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Text,
  HStack,
  Checkbox,
  Divider,
  Collapse,
  useDisclosure,
  IconButton,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { listingsApi } from '../../services/api';
import { SearchFilters } from '../../types';

interface FilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [priceRange, setPriceRange] = useState([0, 5000]);

  const { isOpen: isAdvancedOpen, onToggle: onAdvancedToggle } = useDisclosure();

  const { data: filterOptions } = useQuery(
    'filterOptions',
    listingsApi.getFilterOptions,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  useEffect(() => {
    setLocalFilters(filters);
    if (filters.price_min || filters.price_max) {
      setPriceRange([
        filters.price_min || 0,
        filters.price_max || 5000,
      ]);
    }
  }, [filters]);

  const handleInputChange = (field: keyof SearchFilters, value: any) => {
    const updatedFilters = { ...localFilters, [field]: value || undefined };
    setLocalFilters(updatedFilters);
  };

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    const updatedFilters = {
      ...localFilters,
      price_min: value[0] > 0 ? value[0] : undefined,
      price_max: value[1] < 5000 ? value[1] : undefined,
    };
    setLocalFilters(updatedFilters);
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'DESC',
    };
    setLocalFilters(clearedFilters);
    setPriceRange([0, 5000]);
    onFilterChange(clearedFilters);
  };

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      shadow="sm"
      border="1px"
      borderColor="gray.200"
      position="sticky"
      top={4}
      maxH="calc(100vh - 2rem)"
      overflowY="auto"
    >
      <VStack spacing={6} align="stretch">
        <Heading size="md" color="gray.800">
          Filter Listings
        </Heading>

        {/* Listing Type */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Listing Type
          </FormLabel>
          <Select
            placeholder="All types"
            value={localFilters.listing_type || ''}
            onChange={(e) => handleInputChange('listing_type', e.target.value)}
            size="sm"
          >
            <option value="rent">For Rent</option>
            <option value="sale">For Sale</option>
            <option value="lease">For Lease</option>
          </Select>
        </FormControl>

        {/* Property Type */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Property Type
          </FormLabel>
          <Select
            placeholder="All property types"
            value={localFilters.property_type || ''}
            onChange={(e) => handleInputChange('property_type', e.target.value)}
            size="sm"
          >
            {filterOptions?.property_types.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* City */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            City
          </FormLabel>
          <Input
            placeholder="Enter city name"
            value={localFilters.city || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
            size="sm"
          />
        </FormControl>

        {/* Price Range */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Price Range
          </FormLabel>
          <VStack spacing={3} align="stretch">
            <RangeSlider
              min={0}
              max={5000}
              step={50}
              value={priceRange}
              onChange={handlePriceRangeChange}
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} />
              <RangeSliderThumb index={1} />
            </RangeSlider>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">
                ${priceRange[0].toLocaleString()}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {priceRange[1] >= 5000 ? '$5,000+' : `$${priceRange[1].toLocaleString()}`}
              </Text>
            </HStack>
          </VStack>
        </FormControl>

        {/* Bedrooms */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Bedrooms
          </FormLabel>
          <Select
            placeholder="Any"
            value={localFilters.bedrooms || ''}
            onChange={(e) => handleInputChange('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
            size="sm"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num}+ bedroom{num > 1 ? 's' : ''}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Bathrooms */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Bathrooms
          </FormLabel>
          <Select
            placeholder="Any"
            value={localFilters.bathrooms || ''}
            onChange={(e) => handleInputChange('bathrooms', e.target.value ? parseFloat(e.target.value) : undefined)}
            size="sm"
          >
            {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((num) => (
              <option key={num} value={num}>
                {num}+ bathroom{num > 1 ? 's' : ''}
              </option>
            ))}
          </Select>
        </FormControl>

        <Divider />

        {/* Advanced Filters */}
        <Box>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdvancedToggle}
            rightIcon={isAdvancedOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            width="full"
            justifyContent="space-between"
          >
            Advanced Filters
          </Button>

          <Collapse in={isAdvancedOpen} animateOpacity>
            <VStack spacing={4} mt={4} align="stretch">
              {/* Source */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Source
                </FormLabel>
                <Select
                  placeholder="All sources"
                  value={localFilters.source || ''}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  size="sm"
                >
                  {filterOptions?.sources.map((source) => (
                    <option key={source} value={source}>
                      {source.replace('_', '.').toUpperCase()}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Province */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Province
                </FormLabel>
                <Select
                  placeholder="All provinces"
                  value={localFilters.province || ''}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  size="sm"
                >
                  <option value="ON">Ontario</option>
                  <option value="BC">British Columbia</option>
                  <option value="AB">Alberta</option>
                  <option value="QC">Quebec</option>
                  <option value="MB">Manitoba</option>
                  <option value="SK">Saskatchewan</option>
                  <option value="NS">Nova Scotia</option>
                  <option value="NB">New Brunswick</option>
                  <option value="NL">Newfoundland</option>
                  <option value="PE">Prince Edward Island</option>
                </Select>
              </FormControl>

              {/* Square Feet Range */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Square Feet
                </FormLabel>
                <HStack>
                  <Input
                    placeholder="Min"
                    type="number"
                    value={localFilters.square_feet_min || ''}
                    onChange={(e) => handleInputChange('square_feet_min', e.target.value ? parseInt(e.target.value) : undefined)}
                    size="sm"
                  />
                  <Text fontSize="sm" color="gray.500">to</Text>
                  <Input
                    placeholder="Max"
                    type="number"
                    value={localFilters.square_feet_max || ''}
                    onChange={(e) => handleInputChange('square_feet_max', e.target.value ? parseInt(e.target.value) : undefined)}
                    size="sm"
                  />
                </HStack>
              </FormControl>
            </VStack>
          </Collapse>
        </Box>

        <Divider />

        {/* Action Buttons */}
        <VStack spacing={3}>
          <Button
            colorScheme="primary"
            width="full"
            onClick={applyFilters}
            size="sm"
          >
            Apply Filters
          </Button>
          <Button
            variant="outline"
            width="full"
            onClick={clearFilters}
            size="sm"
          >
            Clear All
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}