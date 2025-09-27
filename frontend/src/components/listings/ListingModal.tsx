'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Image,
  Grid,
  GridItem,
  Box,
  Icon,
  Link,
  Divider,
  AspectRatio,
} from '@chakra-ui/react';
import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaCar,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaEye,
} from 'react-icons/fa';
import { Listing } from '../../types';

interface ListingModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
}

export default function ListingModal({ listing, isOpen, onClose }: ListingModalProps) {
  const formatPrice = (price: number, currency = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPropertyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      house: 'blue',
      condo: 'green',
      townhouse: 'purple',
      apartment: 'orange',
      land: 'yellow',
      commercial: 'red',
      other: 'gray',
    };
    return colors[type] || 'gray';
  };

  const defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="flex-start" spacing={2}>
            <Text fontSize="xl" fontWeight="bold">
              {listing.title}
            </Text>
            <HStack spacing={3}>
              <Text fontSize="2xl" fontWeight="bold" color="primary.600">
                {formatPrice(listing.price)}{listing.listing_type === 'rent' && '/month'}
              </Text>
              <Badge colorScheme={getPropertyTypeColor(listing.property_type)}>
                {listing.property_type}
              </Badge>
              <Badge colorScheme="gray" variant="outline">
                {listing.source.replace('_', '.')}
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Image Gallery */}
            {listing.images && listing.images.length > 0 && (
              <Box>
                <AspectRatio ratio={16 / 9} mb={4}>
                  <Image
                    src={listing.images[0] || defaultImage}
                    alt={listing.title}
                    objectFit="cover"
                    borderRadius="md"
                    fallbackSrc={defaultImage}
                  />
                </AspectRatio>
                {listing.images.length > 1 && (
                  <Grid templateColumns="repeat(auto-fit, minmax(100px, 1fr))" gap={2}>
                    {listing.images.slice(1, 5).map((image, index) => (
                      <AspectRatio key={index} ratio={1}>
                        <Image
                          src={image}
                          alt={`${listing.title} - ${index + 2}`}
                          objectFit="cover"
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ opacity: 0.8 }}
                        />
                      </AspectRatio>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Location */}
            <VStack align="flex-start" spacing={2}>
              <Text fontSize="lg" fontWeight="semibold">Location</Text>
              <HStack spacing={2}>
                <Icon as={FaMapMarkerAlt} color="gray.500" />
                <Text>{listing.address}</Text>
              </HStack>
              <Text color="gray.600">
                {listing.city}, {listing.province} {listing.postal_code}
              </Text>
            </VStack>

            {/* Property Details */}
            <VStack align="flex-start" spacing={3}>
              <Text fontSize="lg" fontWeight="semibold">Property Details</Text>
              <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4} w="full">
                {listing.bedrooms && (
                  <HStack spacing={2}>
                    <Icon as={FaBed} color="gray.500" />
                    <Text>
                      {listing.bedrooms} bedroom{listing.bedrooms > 1 ? 's' : ''}
                    </Text>
                  </HStack>
                )}

                {listing.bathrooms && (
                  <HStack spacing={2}>
                    <Icon as={FaBath} color="gray.500" />
                    <Text>
                      {listing.bathrooms} bathroom{listing.bathrooms > 1 ? 's' : ''}
                    </Text>
                  </HStack>
                )}

                {listing.square_feet && (
                  <HStack spacing={2}>
                    <Icon as={FaRulerCombined} color="gray.500" />
                    <Text>{listing.square_feet.toLocaleString()} sq ft</Text>
                  </HStack>
                )}

                {listing.parking && listing.parking > 0 && (
                  <HStack spacing={2}>
                    <Icon as={FaCar} color="gray.500" />
                    <Text>
                      {listing.parking} parking space{listing.parking > 1 ? 's' : ''}
                    </Text>
                  </HStack>
                )}

                {listing.year_built && (
                  <HStack spacing={2}>
                    <Icon as={FaCalendarAlt} color="gray.500" />
                    <Text>Built in {listing.year_built}</Text>
                  </HStack>
                )}

                {listing.lot_size && (
                  <HStack spacing={2}>
                    <Icon as={FaRulerCombined} color="gray.500" />
                    <Text>{listing.lot_size.toLocaleString()} sq ft lot</Text>
                  </HStack>
                )}
              </Grid>
            </VStack>

            {/* Description */}
            {listing.description && (
              <VStack align="flex-start" spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">Description</Text>
                <Text lineHeight="tall">{listing.description}</Text>
              </VStack>
            )}

            {/* Features */}
            {listing.features && listing.features.length > 0 && (
              <VStack align="flex-start" spacing={3}>
                <Text fontSize="lg" fontWeight="semibold">Features</Text>
                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2} w="full">
                  {listing.features.map((feature, index) => (
                    <Text key={index} fontSize="sm" color="gray.600">
                      • {feature}
                    </Text>
                  ))}
                </Grid>
              </VStack>
            )}

            {/* Contact Information */}
            {listing.contact_info && (
              <VStack align="flex-start" spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">Contact Information</Text>
                {listing.contact_info.agent && (
                  <Text><strong>Agent:</strong> {listing.contact_info.agent}</Text>
                )}
                {listing.contact_info.phone && (
                  <Text><strong>Phone:</strong> {listing.contact_info.phone}</Text>
                )}
                {listing.contact_info.email && (
                  <Text><strong>Email:</strong> {listing.contact_info.email}</Text>
                )}
              </VStack>
            )}

            <Divider />

            {/* Listing Meta Information */}
            <VStack align="flex-start" spacing={2}>
              <Text fontSize="sm" color="gray.500">
                <Icon as={FaEye} mr={2} />
                First seen: {formatDate(listing.first_seen_at)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Last updated: {formatDate(listing.last_scraped_at)}
              </Text>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Link href={listing.url} isExternal>
              <Button
                colorScheme="primary"
                leftIcon={<FaExternalLinkAlt />}
                size="sm"
              >
                View Original Listing
              </Button>
            </Link>
            <Button variant="outline" onClick={onClose} size="sm">
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}